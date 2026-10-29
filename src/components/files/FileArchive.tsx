import React, { useState } from 'react';
import { JobCard, JobCardFile } from '../../types';
import { FolderArchive, Search, FileText, Download, Eye, Paperclip, HardDrive } from 'lucide-react';

interface FileArchiveProps {
  jobCards: JobCard[];
  onSelectJobCard: (jobCard: JobCard) => void;
}

export const FileArchive: React.FC<FileArchiveProps> = ({ jobCards, onSelectJobCard }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Collect all files from all job cards
  const allFiles: (JobCardFile & { jobNo: string; customerName: string; productName: string })[] = [];
  jobCards.forEach((j) => {
    (j.files || []).forEach((f) => {
      allFiles.push({
        ...f,
        jobNo: j.jobNo,
        customerName: j.customerName,
        productName: j.productName,
      });
    });
  });

  const filteredFiles = allFiles.filter(
    (f) =>
      f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.jobNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStorageSize = allFiles.reduce((acc, f) => acc + f.size, 0);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-navy-950 tracking-tight">Artwork & File Archive</h2>
          <p className="text-xs text-slate-500 mt-1">Central repository for press PDFs, vector AI/CDR designs & proof images.</p>
        </div>

        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs flex items-center gap-3">
          <HardDrive className="w-5 h-5 text-sky-600" />
          <div className="text-xs">
            <p className="text-[10px] text-slate-400 font-semibold uppercase">Total Files Stored</p>
            <p className="font-bold text-slate-900">{allFiles.length} files ({(totalStorageSize / 1024 / 1024).toFixed(2)} MB)</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by file name, Job #, or Customer Name..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-navy-600"
          />
        </div>
      </div>

      {/* File Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredFiles.length === 0 ? (
          <div className="col-span-full p-12 bg-white rounded-2xl border border-slate-200 text-center text-slate-400 text-xs">
            No artwork files found in archive. Upload files inside individual Job Cards to store them here.
          </div>
        ) : (
          filteredFiles.map((file) => {
            const jc = jobCards.find((j) => j.jobNo === file.jobNo);
            return (
              <div
                key={file.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="p-3 bg-navy-50 text-navy-800 rounded-xl shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden flex-1">
                    <p className="font-bold text-xs text-slate-900 truncate" title={file.name}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl text-[11px] space-y-1 border border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-navy-900">{file.jobNo}</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-slate-600 truncate">{file.customerName}</p>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  {jc && (
                    <button
                      onClick={() => onSelectJobCard(jc)}
                      className="flex-1 flex items-center justify-center gap-1 p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Job</span>
                    </button>
                  )}
                  <a
                    href={file.fileUrl}
                    download={file.name}
                    className="p-2 bg-navy-900 hover:bg-navy-950 text-white rounded-lg transition-colors"
                    title="Download File"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
