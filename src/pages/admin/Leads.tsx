// src/pages/admin/Leads.tsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from 'react-redux';
import { fetchInstances } from '@/store/botInstancesSlice';
import { RootState } from '@/store';
import BotSelector from '@/components/BotSelector';
import { getLeadsAPI, deleteLeadAPI, updateLeadAPI } from '@/api';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

type Lead = {
  _id: string;
  botInstanceId?: string;
  botKey?: string;
  captureLevel: 'partial' | 'full';
  capturedAt: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'booked' | 'closed';
  source: string;
  score?: number;
  tags?: string[];
  answers?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
};

const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  contacted: 'bg-yellow-100 text-yellow-800',
  qualified: 'bg-green-100 text-green-800',
  unqualified: 'bg-red-100 text-red-800',
  booked: 'bg-purple-100 text-purple-800',
  closed: 'bg-gray-100 text-gray-800',
};

export default function Leads() {
  const dispatch = useDispatch();
  const instances = useSelector((state: RootState) => state.instances.list);
  const [instId, setInstId] = useState<string>("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [editStatus, setEditStatus] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    dispatch(fetchInstances());
  }, [dispatch]);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filter changes
  }, [instId]);

  useEffect(() => {
    fetchLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instId, currentPage]);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: pageSize,
        skip: (currentPage - 1) * pageSize,
      };
      if (instId) {
        params.botInstanceId = instId;
      }
      const response = await getLeadsAPI(params);
      // API returns { leads, total } according to controller
      const leadsData = response.data?.leads || [];
      setLeads(Array.isArray(leadsData) ? leadsData : []);
      setTotal(response.data?.total || 0);
    } catch (error: any) {
      console.error('Error fetching leads:', error);
      setLeads([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this lead?")) return;
    try {
      await deleteLeadAPI(id);
      // If we're on the last page and it becomes empty after deletion, go to previous page
      const isLastPage = currentPage > 1 && leads.length === 1;
      if (isLastPage) {
        setCurrentPage(currentPage - 1);
      } else {
        fetchLeads();
      }
    } catch (error) {
      console.error('Error deleting lead:', error);
    }
  };

  const handleEdit = (lead: Lead) => {
    setEditingLead(lead);
    setEditStatus(lead.status);
  };

  const handleSaveEdit = async () => {
    if (!editingLead) return;
    try {
      await updateLeadAPI(editingLead._id, { status: editStatus });
      setEditingLead(null);
      fetchLeads();
    } catch (error) {
      console.error('Error updating lead:', error);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const totalPages = Math.ceil(total / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, total);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(1);
            }}
            className="cursor-pointer"
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      if (startPage > 2) {
        items.push(
          <PaginationItem key="ellipsis-start">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }

    for (let i = startPage; i <= endPage; i++) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(i);
            }}
            isActive={i === currentPage}
            className="cursor-pointer"
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(
          <PaginationItem key="ellipsis-end">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault();
              handlePageChange(totalPages);
            }}
            className="cursor-pointer"
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  return (
    <div className="p-5 md:p-6 space-y-6">
      {/* Header */}
      <div className="strong-card">
        <div className="h-2 rounded-md bg-black mb-4" />
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold">Leads</h1>
            <p className="text-foreground/80 mt-1">
              View and manage leads captured from bots.
            </p>
          </div>
        </div>

        {/* Instance Selector */}
        <div className="mt-6 flex items-center gap-3">
          <div className="text-sm font-semibold">Filter by Instance:</div>
          <div className="min-w-[260px] flex items-center gap-2">
            <BotSelector
              scope="instance"
              instances={instances || []}
              value={instId}
              onChange={(val) => setInstId(val?.id || "")}
              placeholderOption="All Instances"
            />
            {!!instId && (
              <button
                type="button"
                onClick={() => setInstId("")}
                className="rounded-md border px-2.5 py-1.5 text-sm font-semibold bg-white hover:bg-muted/40"
                title="Clear selected instance"
              >
                Clear
              </button>
            )}
          </div>
          <div className="ml-auto text-xs font-semibold text-foreground/70">
            Viewing: {instId ? `Instance ${instances.find(m => m._id === instId)?.name || instId}` : "All Instances"}
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="strong-card">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-foreground/60">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-foreground/60">No leads found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left p-3 font-bold">Name</th>
                  <th className="text-left p-3 font-bold">Email</th>
                  <th className="text-left p-3 font-bold">Phone</th>
                  <th className="text-left p-3 font-bold">Company</th>
                  <th className="text-left p-3 font-bold">Status</th>
                  <th className="text-left p-3 font-bold">Level</th>
                  <th className="text-left p-3 font-bold">Captured</th>
                  <th className="text-left p-3 font-bold">Source</th>
                  <th className="text-left p-3 font-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead._id} className="border-b border-gray-200 hover:bg-gray-50">
                    <td className="p-3">{lead.name || '-'}</td>
                    <td className="p-3">{lead.email || '-'}</td>
                    <td className="p-3">{lead.phone || '-'}</td>
                    <td className="p-3">{lead.company || '-'}</td>
                    <td className="p-3">
                      {editingLead?._id === lead._id ? (
                        <select
                          value={editStatus}
                          onChange={(e) => setEditStatus(e.target.value)}
                          className="rounded-md border px-2 py-1 text-sm"
                          onBlur={handleSaveEdit}
                          autoFocus
                        >
                          <option value="new">New</option>
                          <option value="contacted">Contacted</option>
                          <option value="qualified">Qualified</option>
                          <option value="unqualified">Unqualified</option>
                          <option value="booked">Booked</option>
                          <option value="closed">Closed</option>
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${statusColors[lead.status] || statusColors.new}`}
                          onClick={() => handleEdit(lead)}
                          style={{ cursor: 'pointer' }}
                        >
                          {lead.status}
                        </span>
                      )}
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${
                        lead.captureLevel === 'full' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {lead.captureLevel}
                      </span>
                    </td>
                    <td className="p-3 text-sm">{formatDate(lead.capturedAt)}</td>
                    <td className="p-3 text-sm">{lead.source || '-'}</td>
                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(lead._id)}
                        className="rounded-md border px-2.5 py-1 text-xs font-semibold bg-white hover:bg-red-50 text-red-600"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {!loading && total > 0 && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
            <div className="text-sm text-foreground/70">
              Showing {startIndex} to {endIndex} of {total}
            </div>
            {totalPages > 1 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage - 1);
                      }}
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                  {renderPaginationItems()}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(currentPage + 1);
                      }}
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
