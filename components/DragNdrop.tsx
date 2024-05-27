import React, { useEffect, useState, useRef } from "react"
import { AiOutlineCheckCircle, AiOutlineCloudUpload } from "react-icons/ai"
import { MdClear } from "react-icons/md"
import clsx from "clsx"

type DragNdropProps = {
  // eslint-disable-next-line no-unused-vars
  onFilesSelected: (files: File[]) => void
}

const DragNdrop = ({ onFilesSelected }: DragNdropProps) => {
  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      const newFiles = Array.from(selectedFiles)
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
      // event.target.value = '';
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const droppedFiles = event.dataTransfer.files
    if (droppedFiles.length > 0) {
      const newFiles = Array.from(droppedFiles)
      setFiles((prevFiles) => [...prevFiles, ...newFiles])
    }
  }

  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index))
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  useEffect(() => {
    onFilesSelected(files)
  }, [files, onFilesSelected])

  return (
    <div
      className={clsx("flex justify-center", {
        "flex-auto": files.length === 0,
      })}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div
        className={clsx(
          "group flex cursor-pointer flex-col items-center justify-start self-start rounded-lg border-2 border-dashed border-blue-500 p-10",
          { "mt-[10vh]": files.length === 0 },
          { "p-10": !(files.length > 0) },
          isDragging
            ? "bg-blue-200 dark:bg-blue-900"
            : "bg-blue-50 dark:bg-blue-950",
        )}
        onClick={handleClick}
      >
        <div
          className="flex flex-col items-center dark:text-slate-400
"
        >
          <div className="-mb-3 flex">
            <AiOutlineCloudUpload className="mr-3 text-[36px]  group-hover:text-teal-500 dark:group-hover:text-teal-800" />
            <span className="font-semibold ">Drag and drop your PDF file</span>
          </div>
          <span className="">or</span>
          <span className="font-semibold group-hover:text-teal-500  dark:group-hover:text-teal-800">
            Upload from Storage
          </span>
        </div>

        <input
          type="file"
          hidden
          id="browse"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".pdf"
          multiple
        />

        {files.length > 0 && (
          <div className="flex min-w-[40vw] flex-col gap-1 pt-8">
            {files.map((file, index) => (
              <div
                className="flex  items-center justify-between p-2"
                key={index}
              >
                <span className="text-sm text-slate-700">{file.name}</span>

                <MdClear
                  className="text-[#888888] hover:text-[#d44444]"
                  onClick={(event) => {
                    event.stopPropagation()
                    handleRemoveFile(index)
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {files.length > 0 && (
          <div className="flex items-center text-[#6dc24b]">
            <AiOutlineCheckCircle
              style={{ color: "#6DC24B", marginRight: 3 }}
            />
            <span className="text-sm font-bold">
              {files.length} file(s) selected
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default DragNdrop
