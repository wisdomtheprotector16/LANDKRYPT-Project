"use client";
import { Upload, FileText, Plus, ShieldQuestion } from "lucide-react";

export const UploadStep = ({
  dragOver,
  uploadedFiles,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileSelect,
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-8">
      <div
        className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 ${
          dragOver
            ? "border-blue-500 bg-blue-500/10"
            : "border-gray-600 hover:border-gray-500"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="mb-4">
          <img
            src="/icons/file.png"
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
          />
          <h3 className="text-xl text-white mb-2">
            Drag And Drop Your Document Here Or Click To Browse File Here
          </h3>
          <p className="text-gray-400 text-sm">
            Supported files: PNG, JPG, PDF (Max 10MB)
          </p>
        </div>
        <input
          type="file"
          multiple
          accept=".png,.jpg,.jpeg,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label
          htmlFor="file-upload"
          className="text-blue-400 hover:text-blue-300 cursor-pointer underline"
        >
          Browse
        </label>
      </div>

      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h4 className="text-white font-medium mb-3">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 bg-gray-700 p-3 rounded"
              >
                <FileText className="w-5 h-5 text-blue-400" />
                <span className="text-white flex-1">{file.name}</span>
                <span className="text-gray-400 text-sm">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 flex gap-1 text-white bg-neutral-800/30 rounded-2xl p-3">
        <div>
          <ShieldQuestion className="" />
        </div>
        <div>
          <h4 className="text font-medium mb-3">
            What documents are accepted?
          </h4>
          <p className="text-gray-400 text-sm">
            We accept land deeds, property titles, tax records, survey reports,
            and official real registry documents. All documents must be legally
            valid and up to date.
          </p>
        </div>
      </div>
    </div>
  );
};
