"use client";

import React, { useEffect, useRef } from "react";

export interface File {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: string;   // ISO string
  storagePath: string;  // New: path under Firebase Storage
}

interface FileListProps {
  files: File[];
  selectedIds: string[];
  onToggleAll: () => void;
  onToggleOne: (fileId: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  selectedIds,
  onToggleAll,
  onToggleOne,
}) => {
  const headerCheckboxRef = useRef<HTMLInputElement>(null);

  const allSelected = files.length > 0 && selectedIds.length === files.length;
  const someSelected =
    selectedIds.length > 0 && selectedIds.length < files.length;

  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
      headerCheckboxRef.current.checked = allSelected;
    }
  }, [allSelected, someSelected, files.length]);

  if (!files.length) {
    return (
      <p className="text-gray-600 py-4">
        No files have been uploaded for this case.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto border border-gray-200 rounded">
      <table className="min-w-full bg-white">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                aria-label="Select all files"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                onChange={onToggleAll}
              />
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              File Name
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Type
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Last Modified
            </th>
            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {files.map((file) => {
            const isChecked = selectedIds.includes(file.id);
            return (
              <tr key={file.id} className="hover:bg-gray-50 border-b">
                <td className="px-4 py-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    aria-label={`Select file ${file.name}`}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={isChecked}
                    onChange={() => onToggleOne(file.id)}
                  />
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">
                  {file.name}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {file.type}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                  {new Date(file.uploadedAt).toLocaleString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    View / Download
                  </a>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default FileList;
