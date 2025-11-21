import React, { useState } from 'react'

interface TransactionUploadPanelProps {
  onUpload: (transactions: any[]) => void
}

export default function TransactionUploadPanel({ onUpload }: TransactionUploadPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.csv')) {
      alert('Please upload a CSV file')
      return
    }

    setIsUploading(true)

    try {
      const text = await file.text()
      const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0)
      if (lines.length < 2) throw new Error('Empty CSV')

      const headers = lines[0].split(',').map(h => h.trim())
      const rows = lines.slice(1)
      const transactions = rows.map((line) => {
        const cols = line.split(',')
        const obj: Record<string, any> = {}
        headers.forEach((h, i) => {
          const val = (cols[i] || '').trim()
          obj[h] = isNaN(Number(val)) ? val : Number(val)
        })
        return obj
      })

      onUpload(transactions)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to parse CSV locally')
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg border-2 border-dashed border-gray-300 max-w-xs">
      <h3 className="text-lg font-semibold mb-3">Upload Transactions</h3>

      <div
        className={`border-2 border-dashed p-4 rounded-lg text-center cursor-pointer transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        {isUploading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            <span className="ml-2">Uploading...</span>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-2">📊</div>
            <div className="text-sm text-gray-600">
              Drop CSV file here or click to browse
            </div>
          </>
        )}
      </div>

      <input
        id="file-input"
        type="file"
        accept=".csv"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="mt-3 text-xs text-gray-500">
        CSV should contain: amount, from_entity, to_entity, from_location, to_location
      </div>
    </div>
  )
}
