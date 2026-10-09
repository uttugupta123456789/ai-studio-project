import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Sparkles,
  Inbox,
  MessageSquare,
  Edit2,
  Trash2,
  X,
  ExternalLink,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { Customer, Enquiry, Communication } from '../types';
import { createCustomer, updateCustomer, deleteCustomer } from '../lib/dataService';
import { ConfirmModal } from './ConfirmModal';

interface CustomersViewProps {
  customers: Customer[];
  enquiries: Enquiry[];
  communications: Communication[];
  onOpenDraftReply: (enquiry: Enquiry) => void;
  onRefresh: () => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  enquiries,
  communications,
  onOpenDraftReply,
  onRefresh,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);

  const filteredCustomers = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.notes && c.notes.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const openCreateModal = () => {
    setEditingCustomer(null);
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setNotes(c.notes || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    try {
      if (editingCustomer) {
        await updateCustomer(editingCustomer.id, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      } else {
        await createCustomer({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }

      setIsModalOpen(false);
      onRefresh();
      if (selectedCustomer && editingCustomer && selectedCustomer.id === editingCustomer.id) {
        setSelectedCustomer({
          ...selectedCustomer,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          notes: notes.trim() || undefined,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!customerToDelete) return;
    try {
      await deleteCustomer(customerToDelete.id);
      if (selectedCustomer?.id === customerToDelete.id) {
        setSelectedCustomer(null);
      }
      setCustomerToDelete(null);
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateSummary = async (customer: Customer) => {
    setIsGeneratingSummary(true);
    setAiSummary(null);
    try {
      const custEnquiries = enquiries.filter((e) => e.customerId === customer.id);
      const custComms = communications.filter((c) => c.customerId === customer.id);

      const res = await fetch('/api/ai/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: customer.name,
          enquiries: custEnquiries,
          communications: custComms,
        }),
      });

      if (!res.ok) throw new Error('Failed to generate summary');
      const data = await res.json();
      setAiSummary(data.summary);
    } catch (err: any) {
      console.error(err);
      setAiSummary('Failed to generate AI summary. Please try again.');
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            Customer Management
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Maintain customer profiles, contact records, communication history, and sales enquiries
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-start sm:self-auto shadow-md shadow-indigo-600/20"
        >
          <Plus className="w-4 h-4" />
          <span>Add Customer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search customers by name, email, phone, or notes..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>
        <div className="text-xs text-slate-400 shrink-0 font-medium">
          {filteredCustomers.length} Customers found
        </div>
      </div>

      {/* Customers List Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Enquiries</th>
                <th className="px-4 py-3">Registered</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCustomers.map((cust) => {
                const custEnquiries = enquiries.filter((e) => e.customerId === cust.id);
                const hasPending = custEnquiries.some((e) => e.status === 'Pending');

                return (
                  <tr key={cust.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-200">{cust.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{cust.id}</div>
                      {cust.notes && (
                        <p className="text-[11px] text-slate-400 italic line-clamp-1 mt-0.5">
                          "{cust.notes}"
                        </p>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{cust.email}</span>
                      </div>
                      {cust.phone && (
                        <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-1">
                          <Phone className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{cust.phone}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200">{custEnquiries.length}</span>
                        {hasPending && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            Pending Response
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-4 py-3.5 text-slate-400 text-[11px]">
                      {new Date(cust.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCustomer(cust);
                            setAiSummary(null);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => openEditModal(cust)}
                          className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setCustomerToDelete(cust)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    No customers found. Click "Add Customer" to register one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Profile Drawer / Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold text-sm">
                  {selectedCustomer.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                    {selectedCustomer.name}
                    <span className="text-xs text-slate-400 font-mono font-normal">
                      #{selectedCustomer.id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Registered on {new Date(selectedCustomer.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCustomer(null)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Contact Information */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                    Email
                  </span>
                  <p className="text-slate-200 font-medium mt-0.5">{selectedCustomer.email}</p>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                    Phone
                  </span>
                  <p className="text-slate-200 font-medium mt-0.5">
                    {selectedCustomer.phone || 'Not provided'}
                  </p>
                </div>
                {selectedCustomer.address && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-850">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Address
                    </span>
                    <p className="text-slate-300 mt-0.5">{selectedCustomer.address}</p>
                  </div>
                )}
                {selectedCustomer.notes && (
                  <div className="sm:col-span-2 pt-2 border-t border-slate-850">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">
                      Internal Notes
                    </span>
                    <p className="text-indigo-300 italic mt-0.5">"{selectedCustomer.notes}"</p>
                  </div>
                )}
              </div>

              {/* AI Communication Summary Card */}
              <div className="p-4 rounded-xl bg-linear-to-r from-indigo-950/40 to-slate-950 border border-indigo-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    <span>AI Interaction Intelligence</span>
                  </div>
                  <button
                    onClick={() => handleGenerateSummary(selectedCustomer)}
                    disabled={isGeneratingSummary}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isGeneratingSummary ? 'animate-spin' : ''}`} />
                    {isGeneratingSummary ? 'Summarizing...' : 'Summarize History'}
                  </button>
                </div>

                {aiSummary ? (
                  <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-line p-3 rounded-lg bg-slate-950/80 border border-slate-800">
                    {aiSummary}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Click "Summarize History" to generate an executive AI briefing covering this customer's enquiries, product interests, and pending action items.
                  </p>
                )}
              </div>

              {/* Customer Enquiries */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Inbox className="w-3.5 h-3.5 text-indigo-400" />
                  Enquiries History ({enquiries.filter((e) => e.customerId === selectedCustomer.id).length})
                </h4>
                <div className="space-y-2">
                  {enquiries
                    .filter((e) => e.customerId === selectedCustomer.id)
                    .map((enq) => (
                      <div
                        key={enq.id}
                        className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                      >
                        <div className="pr-3">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-slate-200">
                              {enq.productName || 'General Enquiry'}
                            </span>
                            <span className={`px-2 py-0.2 rounded text-[10px] font-bold ${
                              enq.status === 'Pending' ? 'bg-amber-500/10 text-amber-400' : 'bg-emerald-500/10 text-emerald-400'
                            }`}>
                              {enq.status}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px] line-clamp-2">{enq.enquiryText}</p>
                        </div>
                        <button
                          onClick={() => {
                            onOpenDraftReply(enq);
                            setSelectedCustomer(null);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[11px] shrink-0 flex items-center gap-1 shadow-xs"
                        >
                          <Sparkles className="w-3 h-3" />
                          Reply
                        </button>
                      </div>
                    ))}

                  {enquiries.filter((e) => e.customerId === selectedCustomer.id).length === 0 && (
                    <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-950 rounded-xl">
                      No enquiries registered for this customer yet.
                    </p>
                  )}
                </div>
              </div>

              {/* Customer Communications Timeline */}
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  Communications Timeline ({communications.filter((c) => c.customerId === selectedCustomer.id).length})
                </h4>
                <div className="space-y-2">
                  {communications
                    .filter((c) => c.customerId === selectedCustomer.id)
                    .map((comm) => (
                      <div
                        key={comm.id}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className={`font-semibold ${
                            comm.direction === 'Incoming' ? 'text-blue-400' : 'text-emerald-400'
                          }`}>
                            {comm.direction === 'Incoming' ? 'Incoming Email' : 'Sent Response'}
                          </span>
                          <span className="text-slate-500">
                            {new Date(comm.sentOrReceivedAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="font-medium text-slate-200">{comm.subject}</p>
                        <p className="text-slate-400 text-[11px] leading-relaxed whitespace-pre-wrap">{comm.messageBody}</p>
                      </div>
                    ))}

                  {communications.filter((c) => c.customerId === selectedCustomer.id).length === 0 && (
                    <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-950 rounded-xl">
                      No communication records yet.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-950/70 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => setCustomerToDelete(selectedCustomer)}
                className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 font-medium"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Customer
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openEditModal(selectedCustomer)}
                  className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-lg"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                {editingCustomer ? 'Edit Customer Details' : 'Add New Customer'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul@example.com"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98201 45678"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Physical / Shipping Address
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Koramangala 4th Block, Bengaluru"
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Customer Notes & Preferences
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Interested in programming laptops with 16GB RAM under ₹50,000"
                  className="w-full p-3 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingCustomer ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Customer Delete */}
      <ConfirmModal
        isOpen={!!customerToDelete}
        title="Delete Customer Profile"
        message={`Are you sure you want to delete ${customerToDelete?.name} (${customerToDelete?.email})? This action cannot be undone.`}
        confirmLabel="Delete Customer"
        isDestructive={true}
        onConfirm={handleDelete}
        onCancel={() => setCustomerToDelete(null)}
      />
    </div>
  );
};
