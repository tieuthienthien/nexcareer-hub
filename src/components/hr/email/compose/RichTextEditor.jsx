import { useMemo } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

const FORMATS = ["header", "bold", "italic", "underline", "list", "align", "link"];

export default function RichTextEditor({ value, onChange, editorRef }) {
  const modules = useMemo(
    () => ({
      toolbar: [
        [{ header: [2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ list: "ordered" }, { list: "bullet" }],
        [{ align: [] }],
        ["link"],
        ["clean"],
      ],
    }),
    []
  );

  return (
    <div className="email-quill overflow-hidden rounded-xl border border-border bg-card">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={FORMATS}
        ref={(instance) => {
          editorRef.current = instance ? instance.getEditor() : null;
        }}
      />
    </div>
  );
}