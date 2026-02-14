import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const RichTextEditor = ({ value, onChange, placeholder }) => {
  const editorRef = useRef(null);
  const quillInstance = useRef(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (isLoaded.current || !editorRef.current) return;

    // 1. Setup Toolbar Options
    const toolbarOptions = [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ color: [] }, { background: [] }],
      ["link", "image"], // Tombol Image default
      ["clean"],
    ];

    // 2. Inisialisasi Quill
    const quill = new Quill(editorRef.current, {
      theme: "snow",
      placeholder: placeholder || "Tulis konten knowledge base...",
      modules: {
        toolbar: {
          container: toolbarOptions,
          handlers: {
            // 3. Custom Image Handler
            image: imageHandler,
          },
        },
      },
    });

    // --- LOGIC: Custom Image Handler ---
    function imageHandler() {
      // Buat elemen input file secara dinamis
      const input = document.createElement("input");
      input.setAttribute("type", "file");
      input.setAttribute("accept", "image/*");
      input.click();

      // Opsi 1: Upload dari Komputer
      input.onchange = () => {
        const file = input.files[0];
        if (!file) return;

        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        const QUALITY = 0.85;

        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            let { width, height } = img;
            const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height, 1);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);

            const compressedDataUrl = canvas.toDataURL("image/jpeg", QUALITY);
            const range = quill.getSelection(true);
            quill.insertEmbed(range.index, "image", compressedDataUrl);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      };

      // Note: Jika ingin opsi "Input URL", biasanya kita pakai Modal custom.
      // Untuk simplifikasi, user bisa klik ikon 'Link' lalu paste URL gambar,
      // atau kita bisa memodifikasi handler ini lebih lanjut nanti.
      // Saat ini Quill default-nya support paste URL gambar langsung.
    }

    // 4. Set Initial Value
    if (value) quill.root.innerHTML = value;

    // 5. Listen Changes
    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      onChange(html === "<p><br></p>" ? "" : html);
    });

    quillInstance.current = quill;
    isLoaded.current = true;
  }, []);

  // Update content jika value berubah drastis (misal saat Edit Mode diaktifkan)
  useEffect(() => {
    if (quillInstance.current && value !== quillInstance.current.root.innerHTML) {
      // Hanya update jika perbedaannya signifikan (misal ganti item edit)
      // Cek length untuk menghindari loop update cursor
      if (Math.abs(quillInstance.current.getLength() - value.length) > 5 || value === "") {
        quillInstance.current.root.innerHTML = value || "";
      }
    }
  }, [value]);

  return (
    <div className="bg-[var(--color-bg)] rounded-lg overflow-hidden border border-[var(--color-border)]">
      {/* Tambahkan style untuk handling gambar di dalam editor agar responsif */}
      <style>{`
        .ql-editor img {
            max-width: 100%;
            max-height: 360px;
            height: auto;
            border-radius: 8px;
            margin: 10px 0;
            border: 1px solid var(--color-border);
            object-fit: contain;
            display: block;
        }
        .ql-container {
            font-family: inherit;
            font-size: 14px;
        }
        @media (max-width: 640px) {
          .ql-editor img {
            max-height: 240px;
          }
        }
      `}</style>
      <div ref={editorRef} style={{ minHeight: "250px", border: "none" }} />
    </div>
  );
};

export default RichTextEditor;
