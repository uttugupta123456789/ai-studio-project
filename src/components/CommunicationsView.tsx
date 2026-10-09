import React, { useState } from 'react';
import {
  MessageSquare,
  Search,
  Mail,
  Send,
  Sparkles,
  CheckCircle,
  Clock,
  Filter,
  User,
  Inbox,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Communication, Customer, Enquiry } from '../types';

interface CommunicationsViewProps {
  communications: Communication[];
  customers: Customer[];
  enquiries: Enquiry[];
  onSelectCustomer?: (customer: Customer) => void;
  onSelectEnquiry?: (enquiry: Enquiry) => void;
}

export const CommunicationsView: React.FC<CommunicationsViewProps> = ({
  communications,
  customers,
  enquiries,
  onSelectCustomer,
  onSelectEnquiry,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [directionFilter, setDirectionFilter] = useState('All');
  const [channelFilter, setChannelFilter] = useState('All');

  const filteredComms = communications.filter((comm) => {
    const matchesSearch =
      (comm.subject && comm.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
      comm.messageBody.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDirection = directionFilter === 'All' || comm.direction === directionFilter;
    const matchesChannel = channelFilter === 'All' || comm.channel === channelFilter;

    return matchesSearch && matchesDirection && matchesChannel;
  });

  const getStatusBadge = (status: Communication['status']) => {
    switch (status) {
      case 'Sent':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" />
            Sent
          </span>
        );
      case 'Received':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Mail className="w-3 h-3" />
            Received
          </span>
        );
      case 'Draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Sparkles className="w-3 h-3" />
            Draft (Not Sent)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-indigo-400" />
          Customer Communication History & Logs
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Audit trail of incoming emails, sent replies via Gmail, in-store notes, and AI drafts
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search communication records by subject, message text..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm bg-slate-950 border border-slate-800 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Direction:</span>
            <select
              value={directionFilter}
              onChange={(e) => setDirectionFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Directions</option>
              <option value="Incoming">Incoming Only</option>
              <option value="Outgoing">Outgoing Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Channels</option>
              <option value="Gmail">Gmail</option>
              <option value="Manual">Manual / In-Store</option>
              <option value="Phone">Phone</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/60">
          <span>
            Showing <strong className="text-slate-200">{filteredComms.length}</strong> of{' '}
            {communications.length} records
          </span>
          <div className="flex items-center gap-3 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400" /> Sent Response
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <span className="w-2 h-2 rounded-full bg-blue-400" /> Incoming Message
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" /> AI Draft
            </span>
          </div>
        </div>
      </div>

      {/* Communications Timeline */}
      <div className="space-y-3.5">
        {filteredComms.map((comm) => {
          const isIncoming = comm.direction === 'Incoming';
          const customer = customers.find((c) => c.id === comm.customerId);
          const enquiry = enquiries.find((e) => e.id === comm.enquiryId);

          return (
            <div
              key={comm.id}
              className={`p-4 rounded-xl border transition-all ${
                isIncoming
                  ? 'bg-slate-900 border-slate-800/90 hover:border-blue-500/30'
                  : 'bg-slate-900 border-slate-800/90 hover:border-emerald-500/30'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-800/80">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      isIncoming
                        ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isIncoming ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-100">
                        {isIncoming ? 'Incoming Customer Inquiry' : 'Outgoing Store Response'}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-medium">
                        {comm.channel}
                      </span>
                      {getStatusBadge(comm.status)}
                    </div>
                    {customer && (
                      <span className="text-[11px] text-slate-400">
                        Customer: <strong className="text-slate-300">{customer.name}</strong> ({customer.email})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-right">
                  <span className="text-[11px] text-slate-400">
                    {new Date(comm.sentOrReceivedAt).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Subject */}
              {comm.subject && (
                <div className="pt-2 text-xs font-medium text-slate-200">
                  Subject: <span className="font-normal text-slate-300">{comm.subject}</span>
                </div>
              )}

              {/* Message Body */}
              <div className="mt-2 p-3 rounded-lg bg-slate-950/70 border border-slate-850 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                {comm.messageBody}
              </div>

              {/* Footer Meta */}
              <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500">
                <span className="font-mono">ID: {comm.id}</span>
                {comm.gmailMessageId && (
                  <span className="font-mono text-slate-500">
                    Gmail Message ID: {comm.gmailMessageId}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredComms.length === 0 && (
          <div className="py-16 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
            No communication records found for the current search.
          </div>
        )}
      </div>
    </div>
  );
};
