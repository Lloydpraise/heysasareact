import { GlassCard, Toggle } from '../shared/ui';
import { ICONS, MAT_CONFIG } from '../../../constants/preferencesConfig';

export function MaterialsSection({
  materials,
  editingId,
  formData,
  updateFormData,
  addOrUpdateMaterial,
  editMaterial,
  deleteMaterial,
  cancelEdit,
  loadError,
}) {

  const isEditing = editingId !== null || formData.title !== '' || formData.content !== '';
  const showForm = editingId !== null || (materials.length === 0 && !isEditing) || (isEditing && !editingId) || formData.isNew;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <GlassCard className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Marketing Materials</h3>
          <p className="text-sm text-slate-600 mt-1">Provide the AI with content to use when negotiating and following up.</p>
        </div>
        {!showForm && (
          <button 
            onClick={() => updateFormData({ isNew: true, type: 'testimonial', title: '', content: '', is_active: true, expires_at: '' })}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors shrink-0 flex items-center gap-2"
          >
            <span>+ Add Material</span>
          </button>
        )}
      </GlassCard>

      {loadError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">Could not load materials: {loadError.message}</p>}

      {showForm ? (
        <MaterialForm 
          formData={formData}
          updateFormData={updateFormData}
          onSave={() => { addOrUpdateMaterial(); updateFormData({ isNew: false }); }}
          onCancel={() => { cancelEdit(); updateFormData({ isNew: false }); }}
          isEditing={editingId !== null}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map(mat => (
            <MaterialItem 
              key={mat.id} 
              material={mat} 
              onEdit={() => editMaterial(mat)} 
              onDelete={() => deleteMaterial(mat.id)} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MaterialItem({ material, onEdit, onDelete }) {
  const config = MAT_CONFIG[material.type] || MAT_CONFIG.testimonial;
  const isExpired = material.expires_at && new Date(material.expires_at) < new Date();

  return (
    <div className={`p-5 rounded-2xl border transition-colors ${
      material.is_active && !isExpired 
        ? 'bg-slate-50 border-slate-200 hover:border-slate-300' 
        : 'bg-slate-100 border-slate-200 opacity-80'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div 
            className="p-1.5 rounded-lg" 
            style={{ backgroundColor: `${config.color}20`, color: config.color }}
            dangerouslySetInnerHTML={{ __html: config.icon }} 
          />
          <span className="text-xs font-medium text-slate-600">{config.label}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="p-1.5 text-slate-500 hover:text-[#28A745] bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" dangerouslySetInnerHTML={{ __html: ICONS.edit }} />
          <button onClick={onDelete} className="p-1.5 text-slate-500 hover:text-red-500 bg-slate-100 hover:bg-red-50 rounded-lg transition-colors" dangerouslySetInnerHTML={{ __html: ICONS.trash }} />
        </div>
      </div>
      
      <h4 className="text-sm font-semibold text-slate-800 mb-1">{material.title}</h4>
      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{material.content}</p>
      
      <div className="flex items-center justify-between text-xs font-medium">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${material.is_active ? 'bg-green-500' : 'bg-gray-600'}`}></span>
          <span className={material.is_active ? 'text-slate-700' : 'text-slate-500'}>
            {material.is_active ? 'Active' : 'Paused'}
          </span>
        </div>
        {material.expires_at && (
          <span className={isExpired ? 'text-red-400' : 'text-orange-400'}>
            {isExpired ? 'Expired' : `Expires ${new Date(material.expires_at).toLocaleDateString()}`}
          </span>
        )}
      </div>
    </div>
  );
}

function MaterialForm({ formData, updateFormData, onSave, onCancel, isEditing }) {
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      updateFormData({ fileName: file.name });
    }
  };

  return (
    <GlassCard className="animate-in fade-in zoom-in-95 duration-200">
      <h3 className="text-sm font-semibold text-slate-800 mb-6">
        {isEditing ? 'Edit Material' : 'Add New Material'}
      </h3>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Material Type</label>
            <select 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              value={formData.type}
              onChange={(e) => updateFormData({ type: e.target.value })}
            >
              {Object.entries(MAT_CONFIG).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Title (Internal)</label>
            <input 
              type="text" 
              placeholder="e.g., Summer Discount 2026"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              value={formData.title}
              onChange={(e) => updateFormData({ title: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Content</label>
          <textarea 
            rows={4}
            placeholder="Type the exact text you want the AI to use..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors resize-none"
            value={formData.content}
            onChange={(e) => updateFormData({ content: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Optional Attachment</label>
            <div className="relative">
              <input 
                type="file" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                accept="image/*,.pdf"
              />
              <div className="w-full bg-slate-50 border border-dashed border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-500 flex items-center justify-center gap-2 hover:bg-slate-100 transition-colors">
                <span dangerouslySetInnerHTML={{ __html: ICONS.upload }} />
                {formData.fileName ? formData.fileName : 'Click to upload image or PDF'}
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-600 uppercase tracking-wider">Expiration Date</label>
            <input 
              type="date" 
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 focus:outline-none focus:border-[#28A745] transition-colors"
              value={formData.expires_at ? formData.expires_at.split('T')[0] : ''}
              onChange={(e) => updateFormData({ expires_at: e.target.value })}
            />
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200/80">
          <Toggle 
            label="Material Active" 
            description="If disabled, the AI will stop using this material immediately."
            checked={formData.is_active}
            onChange={(val) => updateFormData({ is_active: val })}
          />
        </div>

        <div className="flex justify-end gap-3 pt-6">
          <button 
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={onSave}
            disabled={!formData.title.trim() || !formData.content.trim()}
            className="px-5 py-2.5 rounded-xl text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Material
          </button>
        </div>
      </div>
    </GlassCard>
  );
}