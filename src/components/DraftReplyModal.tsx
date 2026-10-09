import React, { useState, useEffect } from 'react';
import { Sparkles, Send, CheckCircle, RefreshCw, X, Mail, AlertCircle } from 'lucide-react';
import { Enquiry, Customer, Product } from '../types';
import { createCommunication, updateEnquiry } from '../lib/dataService';
import { getAccessToken } from '../lib/firebase';

interface DraftReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  enquiry: Enquiry;
  customer?: Customer | null;
  product?: Product | null;
  isGmailConnected: boolean;
  onSuccess: () => void;
}

export const DraftReplyModal: React.FC<DraftReplyModalProps> = ({
  isOpen,
  onClose,
  enquiry,
  customer,
  product,
  isGmailConnected,
  onSuccess,
}) => {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sendMethod, setSendMethod] = useState<'gmail' | 'manual'>(isGmailConnected ? 'gmail' : 'manual');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && enquiry) {
      setError(null);
      generateDraft();
    }
  }, [isOpen, enquiry]);

  useEffect(() => {
    if (isGmailConnected) {
      setSendMethod('gmail');
    } else {
      setSendMethod('manual');
    }
  }, [isGmailConnected]);

  const generateDraft = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/draft-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer?.name || enquiry.customerName,
          customerEmail: customer?.email || enquiry.customerEmail,
          enquiryText: enquiry.enquiryText,
          product: product || null,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to generate draft');
      }

      const data = await res.json();
      setSubject(data.subject || `Regarding your enquiry at ElectroSales Hub`);
      setBody(data.body || '');
    } catch (err: any) {
      console.error(err);
      setError('Unable to auto-generate draft. You can write your response manually.');
      setSubject(`Regarding your enquiry: ${enquiry.productName || 'Electronics enquiry'}`);
      setBody(`Hi ${enquiry.customerName},\n\nThank you for reaching out to us regarding your enquiry.\n\nBest regards,\nElectroSales Team`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSend = async () => {
    if (!subject.trim() || !body.trim()) {
      setError('Subject and body cannot be empty.');
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      let gmailMsgId: string | undefined = undefined;

      if (sendMethod === 'gmail') {
        const token = await getAccessToken();
        if (!token) {
          throw new Error('Gmail is not authorized. Please connect your Gmail account first or choose "Log Manual Response".');
        }

        const sendRes = await fetch('/api/gmail/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            to: enquiry.customerEmail,
            subject: subject.trim(),
            messageBody: body.trim(),
            inReplyToMessageId: enquiry.gmailMessageId,
            threadId: enquiry.gmailThreadId,
          }),
        });

        if (!sendRes.ok) {
          const errData = await sendRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to send email via Gmail API');
        }

        const sendResult = await sendRes.json();
        gmailMsgId = sendResult.messageId;
      }

      // Record communication in Firestore
      await createCommunication({
        customerId: enquiry.customerId,
        enquiryId: enquiry.id,
        channel: sendMethod === 'gmail' ? 'Gmail' : 'Manual',
        direction: 'Outgoing',
        subject: subject.trim(),
        messageBody: body.trim(),
        status: 'Sent',
        gmailMessageId: gmailMsgId,
        sentOrReceivedAt: new Date().toISOString(),
        authorName: 'Staff Member',
      });

      // Update enquiry status to 'Responded'
      await updateEnquiry(enquiry.id, {
        status: 'Responded',
        draftResponse: body.trim(),
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while sending.');
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                Draft Customer Response
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-normal">
                  AI-Powered
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                To: <span className="text-slate-200 font-medium">{enquiry.customerName}</span> ({enquiry.customerEmail})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {/* Customer Enquiry Snippet */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 text-xs">
            <span className="text-slate-400 font-medium uppercase tracking-wider block mb-1">
              Customer Enquiry ({enquiry.source})
            </span>
            <p className="text-slate-200 italic line-clamp-3">"{enquiry.enquiryText}"</p>
            {product && (
              <div className="mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">Related Product:</span>
                <span className="text-indigo-300 font-medium">{product.name} (₹{product.price.toLocaleString('en-IN')})</span>
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Subject Field */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject line..."
              className="w-full px-3.5 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Response Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-slate-300">
                Response Message
              </label>
              <button
                type="button"
                onClick={generateDraft}
                disabled={isGenerating}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                {isGenerating ? 'Regenerating...' : 'Regenerate Draft'}
              </button>
            </div>
            <textarea
              rows={8}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Draft your message here..."
              className="w-full p-3.5 text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed font-sans resize-none"
            />
          </div>

          {/* Send Method Selector */}
          <div className="p-3.5 rounded-xl bg-slate-800/40 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-300 font-medium">Delivery Channel:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSendMethod('gmail')}
                disabled={!isGmailConnected}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                  sendMethod === 'gmail'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                } ${!isGmailConnected ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Mail className="w-3.5 h-3.5 text-red-400" />
                Send via Gmail API
                {!isGmailConnected && ' (Not Connected)'}
              </button>
              <button
                type="button"
                onClick={() => setSendMethod('manual')}
                className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 font-medium transition-colors ${
                  sendMethod === 'manual'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Log Sent Message
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
          <p className="text-xs text-slate-400">
            {sendMethod === 'gmail'
              ? 'Will send directly from your connected Gmail address.'
              : 'Records message into customer communication history.'}
          </p>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isSending}
              className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSend}
              disabled={isSending || isGenerating}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isSending ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  Approve & {sendMethod === 'gmail' ? 'Send via Gmail' : 'Log Response'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
