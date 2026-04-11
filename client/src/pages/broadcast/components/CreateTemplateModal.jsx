import React, { useState } from "react";
import { FaTimes, FaImage, FaVideo, FaFileAlt, FaWhatsapp } from "react-icons/fa";

const CreateTemplateModal = ({ isOpen, onClose, onSubmit, submitting }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: "MARKETING",
    name: "",
    language: "id",
    headerType: "NONE",
    headerText: "",
    headerMedia: null,
    bodyText: "",
    footerText: "",
  });

  const [previewMedia, setPreviewMedia] = useState(null);
  const [buttons, setButtons] = useState([]);

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData(prev => ({ ...prev, headerMedia: file }));
      // Create local preview URL
      const objectUrl = URL.createObjectURL(file);
      setPreviewMedia(objectUrl);
    }
  };

  const removeMedia = () => {
    setFormData(prev => ({ ...prev, headerMedia: null }));
    if (previewMedia) URL.revokeObjectURL(previewMedia);
    setPreviewMedia(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.bodyText) return;
    
    // Normalize name to Meta format (lowercase, underscores)
    const normalizedData = {
      ...formData,
      name: formData.name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, ''),
      buttons
    };
    
    onSubmit(normalizedData);
  };

  const handleAddButton = (e) => {
    const type = e.target.value;
    if (!type || buttons.length >= 10) return;
    
    // reset select
    e.target.value = "";
    
    let newBtn = { id: Date.now(), type, text: '' };
    if (type === 'URL') {
      newBtn.url = '';
    } else if (type === 'PHONE_NUMBER') {
      newBtn.phone_number = '';
    } else if (type === 'COPY_CODE') {
      newBtn.example = '';
    }
    
    setButtons(prev => [...prev, newBtn]);
  };

  const removeButton = (id) => {
    setButtons(prev => prev.filter(b => b.id !== id));
  };

  const handleButtonChange = (id, field, value) => {
    setButtons(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Kategori Template</label>
        <select 
          name="category" 
          value={formData.category} 
          onChange={handleInputChange}
          className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-3 focus:outline-none focus:border-blue-500"
        >
          <option value="MARKETING">Marketing (Promosi, Penawaran)</option>
          <option value="UTILITY">Utility (Update Transaksi, Notifikasi)</option>
          <option value="AUTHENTICATION">Authentication (OTP, Verifikasi)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Nama Template</label>
        <input 
          type="text" 
          name="name" 
          placeholder="contoh_promo_ramadhan"
          value={formData.name} 
          onChange={handleInputChange}
          required
          className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-3 focus:outline-none focus:border-blue-500"
        />
        <p className="text-xs text-white/40 mt-1">Hanya gunakan huruf kecil, angka, dan garis bawah (_).</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Bahasa</label>
        <select 
          name="language" 
          value={formData.language} 
          onChange={handleInputChange}
          className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-3 focus:outline-none focus:border-blue-500"
        >
          <option value="id">Indonesian (id)</option>
          <option value="en_US">English (US)</option>
          <option value="en">English (en)</option>
        </select>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <div className="p-4 border border-white/10 rounded-lg bg-black/20">
        <label className="block text-sm font-medium text-white/70 mb-2">Header (Opsional)</label>
        <select 
          name="headerType" 
          value={formData.headerType} 
          onChange={handleInputChange}
          className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-2 mb-3 text-sm focus:outline-none focus:border-blue-500"
        >
          <option value="NONE">Tidak Ada (None)</option>
          <option value="TEXT">Teks (Maks 60 Karakter)</option>
          <option value="IMAGE">Gambar (Image)</option>
          <option value="VIDEO">Video</option>
          <option value="DOCUMENT">Dokumen (PDF)</option>
        </select>

        {formData.headerType === 'TEXT' && (
          <input 
            type="text" 
            name="headerText" 
            placeholder="Header singkat (opsional)"
            maxLength={60}
            value={formData.headerText} 
            onChange={handleInputChange}
            className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded p-2 text-sm focus:outline-none focus:border-blue-500"
          />
        )}

        {['IMAGE', 'VIDEO', 'DOCUMENT'].includes(formData.headerType) && (
          <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center">
            {previewMedia ? (
              <div className="relative inline-block max-w-full">
                {formData.headerType === 'IMAGE' && <img src={previewMedia} alt="Preview" className="max-h-32 rounded object-cover mx-auto" />}
                {formData.headerType === 'VIDEO' && <video src={previewMedia} controls className="max-h-32 rounded mx-auto" />}
                {formData.headerType === 'DOCUMENT' && <FaFileAlt className="text-4xl text-blue-400 mx-auto" />}
                <button 
                  type="button" 
                  onClick={removeMedia}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <FaTimes size={12} />
                </button>
                <span className="block text-xs mt-2 text-white/70 truncate">{formData.headerMedia?.name}</span>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center">
                {formData.headerType === 'IMAGE' ? <FaImage className="text-3xl text-white/40 mb-2" /> : null}
                {formData.headerType === 'VIDEO' ? <FaVideo className="text-3xl text-white/40 mb-2" /> : null}
                {formData.headerType === 'DOCUMENT' ? <FaFileAlt className="text-3xl text-white/40 mb-2" /> : null}
                <span className="text-sm text-blue-400 hover:text-blue-300">Pilih file untuk diupload</span>
                <input 
                  type="file" 
                  className="hidden" 
                  accept={
                    formData.headerType === 'IMAGE' ? "image/jpeg,image/png" : 
                    formData.headerType === 'VIDEO' ? "video/mp4" : "application/pdf"
                  }
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Body Text (Wajib)</label>
        <textarea 
          name="bodyText" 
          placeholder="Isi pesan utama template Anda. Gunakan {{1}}, {{2}} untuk parameter dinamis."
          value={formData.bodyText} 
          onChange={handleInputChange}
          required
          rows={5}
          className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-3 focus:outline-none focus:border-blue-500"
        />
        <div className="flex justify-between items-center mt-1">
           <p className="text-xs text-white/40">Gunakan kurung kurawal ganda untuk variabel: {'{{1}}'}</p>
           <span className="text-xs text-white/50">{formData.bodyText.length}/1024</span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-white/70 mb-1">Footer (Opsional)</label>
        <input 
          type="text" 
          name="footerText" 
          placeholder="Teks kecil di bagian bawah (maks 60 karakter)"
          maxLength={60}
          value={formData.footerText} 
          onChange={handleInputChange}
          className="w-full bg-[var(--input-bg)] text-white border border-white/20 rounded-lg p-3 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Buttons Section */}
      <div className="p-4 border border-white/10 rounded-lg bg-black/20 mt-4">
        <div className="flex justify-between items-center mb-4">
          <label className="block text-sm font-medium text-white/70">Buttons (Opsional)</label>
          <select 
            onChange={handleAddButton}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium py-1 px-3 rounded cursor-pointer focus:outline-none"
            disabled={buttons.length >= 10}
            defaultValue=""
          >
            <option value="" disabled>+ Add button</option>
            <option value="QUICK_REPLY">Custom (Quick Reply)</option>
            <option value="URL">Visit website</option>
            <option value="PHONE_NUMBER">Call phone number</option>
            <option value="COPY_CODE">Copy offer code</option>
          </select>
        </div>
        
        {buttons.length > 0 && (
          <div className="space-y-3">
            {buttons.map((btn) => (
              <div key={btn.id} className="relative p-3 bg-black/40 border border-white/10 rounded-lg">
                <button type="button" onClick={() => removeButton(btn.id)} className="absolute top-2 right-2 text-red-500 hover:text-red-400">
                   <FaTimes size={12} />
                </button>
                
                <div className="flex gap-4 items-start pr-4">
                  <div className="w-1/3">
                     <span className="text-[10px] uppercase text-white/40 block mb-1 font-bold tracking-wider">Type of Action</span>
                     <div className="text-xs text-white/80 bg-white/5 px-2 py-2 rounded border border-white/10">
                       {btn.type === 'QUICK_REPLY' && 'Quick Reply'}
                       {btn.type === 'URL' && 'Visit Website'}
                       {btn.type === 'PHONE_NUMBER' && 'Call Number'}
                       {btn.type === 'COPY_CODE' && 'Copy Code'}
                     </div>
                  </div>
                  
                  <div className="flex-1 space-y-2">
                    {btn.type !== 'COPY_CODE' && (
                      <div>
                        <span className="text-[10px] uppercase text-white/40 block mb-1 font-bold tracking-wider">Button Text (Wajib)</span>
                        <input 
                          type="text" 
                          placeholder="Teks tombol (Maks 25)"
                          maxLength={25}
                          value={btn.text}
                          onChange={(e) => handleButtonChange(btn.id, 'text', e.target.value)}
                          className="w-full bg-[var(--input-bg)] text-sm text-white border border-white/20 rounded-md p-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                    
                    {btn.type === 'URL' && (
                      <div>
                        <span className="text-[10px] uppercase text-white/40 block mb-1 font-bold tracking-wider">Website URL</span>
                        <input 
                          type="url" 
                          placeholder="https://"
                          value={btn.url}
                          onChange={(e) => handleButtonChange(btn.id, 'url', e.target.value)}
                          className="w-full bg-[var(--input-bg)] text-sm text-white border border-white/20 rounded-md p-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                    
                    {btn.type === 'PHONE_NUMBER' && (
                      <div>
                        <span className="text-[10px] uppercase text-white/40 block mb-1 font-bold tracking-wider">Phone Number (+Kode Negara)</span>
                        <input 
                          type="text" 
                          placeholder="+62812345678"
                          maxLength={20}
                          value={btn.phone_number}
                          onChange={(e) => handleButtonChange(btn.id, 'phone_number', e.target.value)}
                          className="w-full bg-[var(--input-bg)] text-sm text-white border border-white/20 rounded-md p-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                    
                    {btn.type === 'COPY_CODE' && (
                      <div>
                        <span className="text-[10px] uppercase text-white/40 block mb-1 font-bold tracking-wider">Offer Code</span>
                        <input 
                          type="text" 
                          placeholder="KODEPROMO20"
                          maxLength={15}
                          value={btn.example}
                          onChange={(e) => handleButtonChange(btn.id, 'example', e.target.value)}
                          className="w-full bg-[var(--input-bg)] text-sm text-white border border-white/20 rounded-md p-2 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-[var(--sidebar-bg)] rounded-xl shadow-2xl border border-white/10 w-full max-w-4xl flex flex-col md:flex-row overflow-hidden my-8">
        
        {/* Left Side: Form */}
        <div className="flex-1 p-6 border-r border-white/10 flex flex-col max-h-[85vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white">Buat Template Meta</h2>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
              <FaTimes size={20} />
            </button>
          </div>

          <form id="templateForm" onSubmit={handleSubmit} className="flex-1">
            {/* Minimal Stepper */}
            <div className="flex space-x-2 mb-6">
              <div className={`h-2 flex-1 rounded-full ${step === 1 ? 'bg-blue-500' : 'bg-blue-500/30'}`}></div>
              <div className={`h-2 flex-1 rounded-full ${step === 2 ? 'bg-blue-500' : 'bg-white/10'}`}></div>
            </div>

            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
          </form>

          <div className="mt-8 flex justify-between pt-4 border-t border-white/10">
            {step > 1 ? (
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                disabled={submitting}
              >
                Kembali
              </button>
            ) : (
              <button 
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-white/20 rounded-lg text-white hover:bg-white/10 transition-colors"
                disabled={submitting}
              >
                Batal
              </button>
            )}
            
            {step < 2 ? (
              <button 
                type="button"
                onClick={() => {
                  if (!formData.name) return;
                  setStep(2);
                }}
                disabled={!formData.name}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-lg text-white font-medium disabled:opacity-50 transition-colors"
              >
                Selanjutnya
              </button>
            ) : (
              <button 
                type="submit"
                form="templateForm"
                disabled={submitting || !formData.bodyText}
                className="px-6 py-2 bg-green-600 hover:bg-green-500 rounded-lg text-white font-medium disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {submitting ? "Menyimpan..." : "Submit to Meta"}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: WhatsApp Preview */}
        <div className="w-full md:w-80 bg-[#efeae2] p-6 max-h-[85vh] overflow-y-auto flex flex-col justify-center font-sans" style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")', backgroundSize: 'contain' }}>
          <div className="bg-white rounded-lg shadow-sm p-2 mb-4 break-words">
            <h4 className="text-xs text-gray-500 mb-2 border-b border-gray-100 pb-1 flex items-center gap-1">
               <FaWhatsapp className="text-green-500" /> Template Preview
            </h4>
            
            {/* Header Preview */}
            {formData.headerType === 'TEXT' && formData.headerText && (
               <p className="font-bold text-black text-[15px] mb-1">{formData.headerText}</p>
            )}
            {formData.headerType === 'IMAGE' && previewMedia && (
               <div className="w-full h-32 rounded overflow-hidden mb-2 bg-gray-100 flex items-center justify-center">
                 <img src={previewMedia} alt="Header" className="w-full h-full object-cover" />
               </div>
            )}
            {formData.headerType === 'VIDEO' && previewMedia && (
               <div className="w-full h-32 rounded overflow-hidden mb-2 bg-black flex items-center justify-center">
                 <FaVideo className="text-white/50 text-2xl" />
               </div>
            )}
            {formData.headerType === 'DOCUMENT' && previewMedia && (
               <div className="w-full p-3 rounded mb-2 bg-gray-100 flex items-center gap-2 border border-gray-200">
                 <FaFileAlt className="text-red-500 text-xl" />
                 <span className="text-xs text-gray-700 truncate">{formData.headerMedia?.name}</span>
               </div>
            )}

            {/* Body Preview */}
            <p className="text-[14.2px] leading-snug text-black whitespace-pre-wrap">
              {formData.bodyText || "Cth: Halo {{1}}, ini adalah pesan body."}
            </p>
            
            {/* Footer Preview */}
            {formData.footerText && (
              <p className="text-[11px] text-gray-500 mt-2">{formData.footerText}</p>
            )}
            
            {/* Time signature mock */}
            <div className="text-right mt-1">
               <span className="text-[10px] text-gray-400">12:00 PM</span>
            </div>
          </div>
          
          {/* Buttons Preview */}
          {buttons.length > 0 && (
            <div className="mt-0 flex flex-col gap-[2px] w-full">
              {buttons.map(btn => (
                <div key={btn.id} className="bg-white rounded-lg py-2.5 px-3 text-center text-[#00a884] font-medium text-[13px] border border-gray-100 flex items-center justify-center shadow-sm">
                   {btn.type === 'QUICK_REPLY' && <span className="mr-2 text-sm text-[#00a884] opacity-80">↩</span>}
                   {btn.type === 'URL' && <span className="mr-2 text-sm text-[#00a884] opacity-80">↗</span>}
                   {btn.type === 'PHONE_NUMBER' && <span className="mr-2 text-sm text-[#00a884] opacity-80">📞</span>}
                   {btn.type === 'COPY_CODE' && <span className="mr-2 text-sm text-[#00a884] opacity-80">📋</span>}
                   {btn.type === 'COPY_CODE' ? "Copy code" : (btn.text || "Tombol")}
                </div>
              ))}
            </div>
          )}

          <div className="text-center text-xs text-gray-600 bg-white/80 p-2 rounded-lg backdrop-blur mx-4 border border-black/5 mt-4">
             Tampilan di perangkat End-User WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateTemplateModal;
