import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isDev = process.env.NODE_ENV !== 'production';

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI with required telemetry User-Agent
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: base64url decode for Gmail payload
function decodeBase64Url(base64UrlStr: string): string {
  try {
    const base64 = base64UrlStr.replace(/-/g, '+').replace(/_/g, '/');
    return Buffer.from(base64, 'base64').toString('utf-8');
  } catch (err) {
    return '';
  }
}

// Helper: parse body from Gmail Message payload
function extractBodyFromPayload(payload: any): string {
  if (!payload) return '';
  if (payload.body && payload.body.data) {
    return decodeBase64Url(payload.body.data);
  }
  if (payload.parts && Array.isArray(payload.parts)) {
    for (const part of payload.parts) {
      if (part.mimeType === 'text/plain' && part.body && part.body.data) {
        return decodeBase64Url(part.body.data);
      }
      if (part.mimeType === 'text/html' && part.body && part.body.data) {
        const html = decodeBase64Url(part.body.data);
        return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      }
      if (part.parts) {
        const nested = extractBodyFromPayload(part);
        if (nested) return nested;
      }
    }
  }
  return '';
}

// API: Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'ElectroSales AI Backend', timestamp: new Date().toISOString() });
});

// Helper: Retry wrapper for Gemini API calls with exponential backoff
async function callGeminiWithRetry(fn: () => Promise<any>, retries = 2, delayMs = 600): Promise<any> {
  try {
    return await fn();
  } catch (err: any) {
    if (retries > 0 && (err?.status === 503 || err?.message?.includes('503') || err?.message?.includes('high demand'))) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return callGeminiWithRetry(fn, retries - 1, delayMs * 1.5);
    }
    throw err;
  }
}

// API: AI Natural-Language Query Grounded on Real Data
app.post('/api/ai/query', async (req: Request, res: Response) => {
  try {
    const { prompt, currentContext } = req.body;
    if (!prompt || typeof prompt !== 'string') {
      res.status(400).json({ error: 'Missing or invalid prompt' });
      return;
    }

    const customers = currentContext?.customers || [];
    const products = currentContext?.products || [];
    const enquiries = currentContext?.enquiries || [];
    const communications = currentContext?.communications || [];

    const systemInstruction = `You are the AI Sales Assistant for an Electronics Store.
You assist the store owner and staff in answering questions about customers, products in stock, sales enquiries, and communication history.

CRITICAL INSTRUCTIONS:
1. Ground all answers strictly on the provided real store data (products, customers, enquiries, communications).
2. Never invent customers, products, prices, availability, or enquiries.
3. Prices are strictly in Indian Rupees (INR, ₹).
4. If information is not found in the database, clearly state that it was not found.
5. In addition to a comprehensive, clear, professional natural language answer, identify which specific entities (customer IDs, product IDs, enquiry IDs) directly answer or relate to the user's query, and suggest quick actionable buttons.
6. Return your response in clean JSON matching this exact structure:
{
  "answer": "Clear markdown formatted explanation of the findings, including specific product names, exact prices with ₹, availability statuses, customer names, or enquiry statuses.",
  "matchedEntityIds": {
    "customerIds": ["..."],
    "productIds": ["..."],
    "enquiryIds": ["..."]
  },
  "suggestedActions": [
    {
      "type": "view_enquiry" | "view_customer" | "view_product" | "draft_reply",
      "label": "Human readable action button label, e.g. 'View Enquiry #ENQ-101' or 'Draft Reply to Rahul'",
      "targetId": "ID of the entity",
      "extra": {}
    }
  ]
}`;

    const contextPayload = {
      userQuestion: prompt,
      currentDateTime: new Date().toISOString(),
      storeData: {
        productsCount: products.length,
        products: products.map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          price: p.price,
          availability: p.availability,
          stockCount: p.stockCount,
          brand: p.brand,
          specs: p.specs
        })),
        customersCount: customers.length,
        customers: customers.map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email,
          phone: c.phone,
          notes: c.notes
        })),
        enquiriesCount: enquiries.length,
        enquiries: enquiries.map((e: any) => ({
          id: e.id,
          customerId: e.customerId,
          customerName: e.customerName,
          customerEmail: e.customerEmail,
          productName: e.productName,
          productId: e.productId,
          status: e.status,
          source: e.source,
          receivedAt: e.receivedAt,
          enquiryText: e.enquiryText
        })),
        recentCommunicationsCount: communications.length,
        recentCommunications: communications.slice(0, 10).map((cm: any) => ({
          id: cm.id,
          customerId: cm.customerId,
          direction: cm.direction,
          subject: cm.subject,
          status: cm.status,
          sentOrReceivedAt: cm.sentOrReceivedAt
        }))
      }
    };

    let rawText = '';
    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: JSON.stringify(contextPayload),
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );
      rawText = response.text || '{}';
    } catch (genErr) {
      console.warn('Gemini temporary busy, using deterministic search fallback:', genErr);
      // Deterministic fallback for common questions if AI model is momentarily overloaded
      const qLower = prompt.toLowerCase();
      let matchedProds = products;
      if (qLower.includes('laptop')) matchedProds = products.filter((p: any) => p.category === 'Laptops');
      if (qLower.includes('smartphone')) matchedProds = products.filter((p: any) => p.category === 'Smartphones');
      if (qLower.includes('50,000') || qLower.includes('50000')) matchedProds = matchedProds.filter((p: any) => p.price <= 50000);

      const matchedEnqs = enquiries.filter((e: any) =>
        qLower.includes('pending') ? e.status === 'Pending' : true
      );

      return res.json({
        answer: `Found ${matchedProds.length} matching products and ${matchedEnqs.length} enquiries in the database.`,
        suggestedActions: matchedEnqs.slice(0, 2).map((e: any) => ({
          type: 'view_enquiry',
          label: `Open ${e.customerName}'s Enquiry`,
          targetId: e.id,
        })),
        matchedData: {
          products: matchedProds.slice(0, 4),
          customers: customers.slice(0, 2),
          enquiries: matchedEnqs.slice(0, 4),
        },
      });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = { answer: rawText, matchedEntityIds: {}, suggestedActions: [] };
    }

    // Attach full matching objects
    const matchedProducts = products.filter((p: any) =>
      parsed.matchedEntityIds?.productIds?.includes(p.id)
    );
    const matchedCustomers = customers.filter((c: any) =>
      parsed.matchedEntityIds?.customerIds?.includes(c.id)
    );
    const matchedEnquiries = enquiries.filter((e: any) =>
      parsed.matchedEntityIds?.enquiryIds?.includes(e.id)
    );

    res.json({
      answer: parsed.answer || 'No response generated.',
      suggestedActions: parsed.suggestedActions || [],
      matchedData: {
        products: matchedProducts,
        customers: matchedCustomers,
        enquiries: matchedEnquiries,
      },
    });
  } catch (error: any) {
    console.error('Error in /api/ai/query:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI query' });
  }
});

// API: AI Draft Customer Response Email
app.post('/api/ai/draft-response', async (req: Request, res: Response) => {
  try {
    const { customerName, customerEmail, enquiryText, product, storeName = 'ElectroSales Hub' } = req.body;

    const systemInstruction = `You are a professional sales executive and customer support specialist for an electronics store named "${storeName}".
Your task is to draft a friendly, professional, courteous, and persuasive email response to a customer's enquiry.

Guidelines:
1. Greet the customer by name warmly.
2. Acknowledge and directly answer their specific question about products, specs, availability, or pricing.
3. If a specific product is linked or identified:
   - State the exact price in Indian Rupees (₹).
   - Mention key specs that match their needs.
   - Mention its current availability status (e.g. In Stock / Ready for pickup or dispatch).
4. If the product is out of stock, politely inform them and suggest an available alternative if suitable.
5. Highlight store value additions: 1-Year Official Manufacturer Warranty, Free Local Delivery or In-Store Hands-on Demo, and Easy EMI options.
6. Provide clear store contact details and store timings (Mon-Sat, 10:00 AM - 9:00 PM IST).
7. Do not include markdown codeblocks or placeholder text like [Insert Name]; use real details provided.
8. Return JSON with:
{
  "subject": "Clear, professional email subject line",
  "body": "Complete email body text ready to send"
}`;

    const promptPayload = {
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || '',
      enquiryText: enquiryText || '',
      productDetails: product || null,
    };

    let draftResult: any;
    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: JSON.stringify(promptPayload),
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );
      const raw = response.text || '{}';
      draftResult = JSON.parse(raw);
    } catch (genErr) {
      console.warn('Gemini retry exhausted or unavailable, generating structured template response:', genErr);
      const prodText = product
        ? `Regarding the ${product.name}, it is currently ${product.availability} at our store for ₹${Number(product.price).toLocaleString('en-IN')}.\nAll units include 1-Year Official Manufacturer Warranty and complimentary setup.`
        : 'Thank you for your enquiry. We will be happy to assist you with specs, pricing, and availability.';

      draftResult = {
        subject: `Response to your electronics enquiry: ${product?.name || 'ElectroSales Store'}`,
        body: `Dear ${customerName || 'Customer'},\n\nThank you for reaching out to ElectroSales Hub.\n\n${prodText}\n\nFeel free to reply directly to this email or visit our store during operating hours (Mon-Sat, 10:00 AM - 9:00 PM IST).\n\nWarm regards,\nSales & Support Team\nElectroSales Hub`,
      };
    }

    res.json(draftResult);
  } catch (error: any) {
    console.error('Error drafting response:', error);
    res.status(500).json({ error: error.message || 'Failed to draft response' });
  }
});

// API: AI Extract Enquiry details from an incoming email
app.post('/api/ai/extract-enquiry', async (req: Request, res: Response) => {
  try {
    const { emailSubject, emailBody, senderEmail, senderName, products = [] } = req.body;

    const systemInstruction = `You are an AI document analysis engine for an electronics store.
Analyze an incoming email and determine if it represents a customer sales enquiry (product availability, price quote, specifications question, purchase intent).

Output JSON with:
{
  "isSalesEnquiry": boolean,
  "confidenceScore": number (0 to 1),
  "customerName": "Extracted customer name, or clean sender name",
  "enquirySummary": "Concise summary of what the customer is asking (1-2 sentences)",
  "fullEnquiryText": "Cleaned enquiry message text extracted from the email",
  "detectedProductKeywords": ["laptop", "iphone", etc.],
  "matchedProductId": "id of the best matching product from the catalog, or null",
  "matchedProductName": "name of matched product or null",
  "estimatedBudgetINR": number or null
}`;

    const promptPayload = {
      emailSubject,
      emailBody,
      senderEmail,
      senderName,
      availableProductsCatalog: products.map((p: any) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
      })),
    };

    let result: any;
    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: JSON.stringify(promptPayload),
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );
      result = JSON.parse(response.text || '{}');
    } catch (genErr) {
      console.warn('Gemini temporary busy, using deterministic email parse fallback:', genErr);
      const matched = products.find((p: any) =>
        emailSubject.toLowerCase().includes(p.name.toLowerCase().split(' ')[0]) ||
        emailBody.toLowerCase().includes(p.name.toLowerCase().split(' ')[0])
      );
      result = {
        isSalesEnquiry: true,
        confidenceScore: 0.9,
        customerName: senderName || 'Customer',
        enquirySummary: emailSubject,
        fullEnquiryText: emailBody,
        detectedProductKeywords: ['electronics'],
        matchedProductId: matched?.id || null,
        matchedProductName: matched?.name || null,
        estimatedBudgetINR: matched?.price || null,
      };
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error extracting enquiry:', error);
    res.status(500).json({ error: error.message || 'Failed to extract enquiry' });
  }
});

// API: AI Summarize Customer Communication History
app.post('/api/ai/summarize', async (req: Request, res: Response) => {
  try {
    const { customerName, communications = [], enquiries = [] } = req.body;

    const systemInstruction = `You are a sales assistant AI.
Summarize the complete communication and enquiry history of this customer for the electronics store manager.
Provide:
1. Relationship Overview (total interactions, date of first and latest contact)
2. Products / Categories of Interest
3. Current Status & Any Pending Action Items (e.g. Needs pricing confirmation, awaiting customer reply, resolved)
4. Recommended Next Step for the Sales Rep
Keep the summary concise, clear, and bulleted.`;

    const promptPayload = {
      customerName,
      enquiries,
      communications,
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: JSON.stringify(promptPayload),
      config: { systemInstruction },
    });

    res.json({ summary: response.text || 'No summary available.' });
  } catch (error: any) {
    console.error('Error summarizing customer history:', error);
    res.status(500).json({ error: error.message || 'Failed to summarize' });
  }
});

// API: Standalone AI Email Urgency Classifier
app.post('/api/ai/classify-urgency', async (req: Request, res: Response) => {
  try {
    const { subject = '', bodyText = '', senderEmail = '', senderName = '' } = req.body;
    const systemInstruction = `You are an expert sales triage and intelligence AI for an electronics retail & distributor store.
Classify the following email on the basis of URGENCY:
- 'Critical': Imminent deadlines (today/tomorrow), VIP escalations, high-value bulk B2B deals, immediate complaints or payment issues.
- 'High': Direct purchase inquiries, ready-to-buy quotes, product availability checks for immediate purchase, price negotiation.
- 'Medium': General product questions, comparisons, warranty, general stock inquiries.
- 'Low': Passive inquiries, newsletters, general non-urgent feedback.

Return JSON adhering strictly to:
{
  "urgency": "Critical" | "High" | "Medium" | "Low",
  "urgencyScore": number (1 to 100, where 90-100 is Critical, 70-89 High, 40-69 Medium, 1-39 Low),
  "urgencyReason": "Clear, concise 1-2 sentence reason explaining why this urgency level was assigned",
  "recommendedAction": "Actionable next step for sales rep (e.g. Call immediately, send quotation within 2 hours)",
  "aiCategory": "Bulk / Corporate Order" | "Price / Discount Quote" | "Stock Availability" | "Product Technical Spec" | "Order Status / Support" | "General Inquiry"
}`;

    const promptPayload = { subject, bodyText: bodyText.slice(0, 4000), senderEmail, senderName };

    let result: any;
    try {
      const response = await callGeminiWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: JSON.stringify(promptPayload),
          config: {
            systemInstruction,
            responseMimeType: 'application/json',
          },
        })
      );
      result = JSON.parse(response.text || '{}');
    } catch (genErr) {
      console.warn('Gemini retry fallback for urgency classification:', genErr);
      const lower = (subject + ' ' + bodyText).toLowerCase();
      let urgency = 'Medium';
      let urgencyScore = 55;
      let urgencyReason = 'General customer inquiry received via email.';
      let recommendedAction = 'Reply within 24 hours.';
      let aiCategory = 'General Inquiry';

      if (lower.includes('urgent') || lower.includes('asap') || lower.includes('today') || lower.includes('immediately')) {
        urgency = 'Critical';
        urgencyScore = 95;
        urgencyReason = 'Email explicitly requests urgent or same-day resolution.';
        recommendedAction = 'Immediate phone call or priority reply.';
      } else if (lower.includes('quote') || lower.includes('price') || lower.includes('buy') || lower.includes('stock') || lower.includes('bulk')) {
        urgency = 'High';
        urgencyScore = 80;
        urgencyReason = 'Customer expressing active buying interest or requesting pricing terms.';
        recommendedAction = 'Send quotation and verify stock availability promptly.';
        aiCategory = lower.includes('bulk') ? 'Bulk / Corporate Order' : 'Price / Discount Quote';
      }
      result = { urgency, urgencyScore, urgencyReason, recommendedAction, aiCategory };
    }

    const validUrgencies = ['Critical', 'High', 'Medium', 'Low'];
    if (!validUrgencies.includes(result.urgency)) {
      result.urgency = 'Medium';
    }
    if (typeof result.urgencyScore !== 'number') {
      result.urgencyScore = 55;
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error classifying urgency:', error);
    res.status(500).json({ error: error.message || 'Failed to classify urgency' });
  }
});

// API: Gmail Sync - Retrieve recent customer messages & extract enquiries
app.post('/api/gmail/sync', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Bearer access token' });
      return;
    }
    const token = authHeader.substring(7);
    const { knownMessageIds = [], products = [] } = req.body;

    // 1. Fetch recent messages list from Gmail API
    const listUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15';
    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!listRes.ok) {
      const errText = await listRes.text();
      res.status(listRes.status).json({ error: `Gmail API list error: ${errText}` });
      return;
    }

    const listData = await listRes.json();
    const messageStubs = listData.messages || [];

    const processedMessages: any[] = [];
    let duplicatesCount = 0;

    // 2. Fetch message details for un-imported messages (up to 8 to avoid rate limits)
    for (const stub of messageStubs.slice(0, 8)) {
      if (knownMessageIds.includes(stub.id)) {
        duplicatesCount++;
        continue;
      }

      const msgUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${stub.id}?format=full`;
      const msgRes = await fetch(msgUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!msgRes.ok) continue;

      const msg = await msgRes.json();
      const headers = msg.payload?.headers || [];

      const getHeader = (name: string) => {
        const found = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return found ? found.value : '';
      };

      const fromRaw = getHeader('From');
      const subject = getHeader('Subject') || '(No Subject)';
      const dateHeader = getHeader('Date');

      // Parse sender name & email from "Rahul Sharma <rahul@example.com>"
      let senderName = fromRaw;
      let senderEmail = fromRaw;
      const match = fromRaw.match(/(.*?)\s*<(.+?)>/);
      if (match) {
        senderName = match[1].replace(/["']/g, '').trim();
        senderEmail = match[2].trim();
      }

      const bodyText = extractBodyFromPayload(msg.payload) || msg.snippet || '';

      // Analyze with AI to extract sales enquiry and classify urgency
      let aiExtraction: any = { isSalesEnquiry: true };
      try {
        const extractRes = await callGeminiWithRetry(() =>
          ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: JSON.stringify({
              subject,
              bodyText: bodyText.slice(0, 4000),
              senderName,
              senderEmail,
              productsCatalog: products.map((p: any) => ({
                id: p.id,
                name: p.name,
                category: p.category,
                price: p.price,
              })),
            }),
            config: {
              systemInstruction: `You are an expert sales intelligence and customer inquiry triage specialist for an electronics retail & B2B distributor store.
Analyze the email message and classify it carefully:

1. CLASSIFY URGENCY:
   - "Critical": Imminent purchase deadlines (e.g. today/tomorrow), high-value bulk / corporate deals, urgent escalated complaints or payment/dispatch issues requiring immediate response within 1 hour.
   - "High": Ready-to-buy customer asking for quotes, availability check for purchase this week, active price negotiation, specific product enquiries with buying intent. Expected response within 2-4 hours.
   - "Medium": General product queries, feature comparisons, warranty questions, general store hours, ETA requests. Response within 24 hours.
   - "Low": Passive browsing, marketing/promotions, automated notifications, general non-urgent feedback.

2. URGENCY SCORE: integer 1-100 (90-100 for Critical, 70-89 for High, 40-69 for Medium, 1-39 for Low).
3. URGENCY REASON: 1-2 sentence concise explanation justifying why this urgency level was selected.
4. RECOMMENDED ACTION: Clear recommendation for the sales representative (e.g. "Send bulk quotation with tier discount immediately", "Confirm stock for same-day store pickup").
5. AI CATEGORY: One of ["Bulk / Corporate Order", "Price / Discount Quote", "Stock Availability", "Product Technical Spec", "Order Status / Support", "General Inquiry"].
6. IS SALES ENQUIRY: boolean.

Output clean JSON adhering strictly to:
{
  "urgency": "Critical" | "High" | "Medium" | "Low",
  "urgencyScore": number,
  "urgencyReason": string,
  "recommendedAction": string,
  "aiCategory": string,
  "isSalesEnquiry": boolean,
  "confidence": number,
  "customerName": string,
  "summary": string,
  "enquiryText": string,
  "matchedProductId": string or null,
  "matchedProductName": string or null
}`,
              responseMimeType: 'application/json',
            },
          })
        );
        aiExtraction = JSON.parse(extractRes.text || '{}');
      } catch (err) {
        console.warn('AI analysis fallback for message:', err);
        const lower = (subject + ' ' + bodyText).toLowerCase();
        let urgency = 'Medium';
        let urgencyScore = 55;
        let urgencyReason = 'General customer inquiry received via Gmail.';
        let recommendedAction = 'Review email and reply within standard 24-hour SLA.';
        let aiCategory = 'General Inquiry';

        if (lower.includes('urgent') || lower.includes('asap') || lower.includes('today') || lower.includes('immediately')) {
          urgency = 'Critical';
          urgencyScore = 95;
          urgencyReason = 'Sender flagged message as urgent with same-day timeline requirement.';
          recommendedAction = 'Prioritize immediate reply or phone call to customer.';
        } else if (lower.includes('price') || lower.includes('quote') || lower.includes('stock') || lower.includes('buy') || lower.includes('bulk')) {
          urgency = 'High';
          urgencyScore = 80;
          urgencyReason = 'Customer expressing active buying interest or requesting pricing quote.';
          recommendedAction = 'Send quotation and verify stock availability promptly.';
          aiCategory = lower.includes('bulk') ? 'Bulk / Corporate Order' : 'Price / Discount Quote';
        }

        aiExtraction = {
          urgency,
          urgencyScore,
          urgencyReason,
          recommendedAction,
          aiCategory,
          isSalesEnquiry: true,
          customerName: senderName,
          summary: subject,
          enquiryText: bodyText.slice(0, 500) || msg.snippet,
        };
      }

      const validUrgencies = ['Critical', 'High', 'Medium', 'Low'];
      const finalUrgency = validUrgencies.includes(aiExtraction.urgency) ? aiExtraction.urgency : 'Medium';
      const finalScore = typeof aiExtraction.urgencyScore === 'number' ? Math.min(100, Math.max(1, aiExtraction.urgencyScore)) : 55;
      aiExtraction.urgency = finalUrgency;
      aiExtraction.urgencyScore = finalScore;

      processedMessages.push({
        gmailMessageId: msg.id,
        threadId: msg.threadId,
        senderName: aiExtraction.customerName || senderName,
        senderEmail,
        subject,
        bodyText,
        snippet: msg.snippet,
        date: dateHeader ? new Date(dateHeader).toISOString() : new Date().toISOString(),
        urgency: finalUrgency,
        urgencyScore: finalScore,
        urgencyReason: aiExtraction.urgencyReason || 'Classified by Gemini AI',
        recommendedAction: aiExtraction.recommendedAction || 'Review and reply to customer',
        aiCategory: aiExtraction.aiCategory || 'General Inquiry',
        aiExtraction,
      });
    }

    res.json({
      success: true,
      totalScanned: messageStubs.length,
      duplicatesSkipped: duplicatesCount,
      newMessagesFound: processedMessages.length,
      messages: processedMessages,
    });
  } catch (error: any) {
    console.error('Error syncing Gmail:', error);
    res.status(500).json({ error: error.message || 'Failed to sync Gmail' });
  }
});

// API: Gmail Send Approved Reply
app.post('/api/gmail/send', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Missing or invalid Bearer access token' });
      return;
    }
    const token = authHeader.substring(7);
    const { to, subject, messageBody, inReplyToMessageId, threadId } = req.body;

    if (!to || !subject || !messageBody) {
      res.status(400).json({ error: 'Missing required fields: to, subject, messageBody' });
      return;
    }

    // Construct RFC 2822 email message
    let emailHeaders = [
      `To: ${to}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset="UTF-8"',
      'MIME-Version: 1.0',
    ];

    if (inReplyToMessageId) {
      emailHeaders.push(`In-Reply-To: ${inReplyToMessageId}`);
      emailHeaders.push(`References: ${inReplyToMessageId}`);
    }

    const rawMessage = `${emailHeaders.join('\r\n')}\r\n\r\n${messageBody}`;
    const encodedRaw = Buffer.from(rawMessage)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const sendPayload: any = { raw: encodedRaw };
    if (threadId) {
      sendPayload.threadId = threadId;
    }

    const sendRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sendPayload),
    });

    if (!sendRes.ok) {
      const errBody = await sendRes.text();
      res.status(sendRes.status).json({ error: `Gmail API send failed: ${errBody}` });
      return;
    }

    const sendData = await sendRes.json();
    res.json({
      success: true,
      messageId: sendData.id,
      threadId: sendData.threadId,
      sentAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error sending Gmail:', error);
    res.status(500).json({ error: error.message || 'Failed to send message via Gmail API' });
  }
});

// API: Test Gmail Connection Profile & Live Verification
app.get('/api/gmail/test-connection', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        connected: false,
        error: 'Missing or invalid Bearer access token. Please authenticate.',
      });
      return;
    }
    const token = authHeader.substring(7);
    const profileRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/profile', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!profileRes.ok) {
      const errBody = await profileRes.text();
      res.status(profileRes.status).json({
        connected: false,
        error: `Gmail API profile verification failed: ${errBody}`,
      });
      return;
    }

    const profile = await profileRes.json();
    res.json({
      connected: true,
      emailAddress: profile.emailAddress,
      messagesTotal: profile.messagesTotal,
      threadsTotal: profile.threadsTotal,
      historyId: profile.historyId,
      testedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error testing Gmail connection:', error);
    res.status(500).json({
      connected: false,
      error: error.message || 'Failed to test Gmail connection',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT} (dev: ${isDev})`);
  });
}

startServer();
