import { useState, useCallback, useEffect } from 'react';
import { mockMaterials } from '../services/mockPreferences';
import { getMaterials } from '../services/settingsService';

export function useMaterials() {
  const [materials, setMaterials] = useState(mockMaterials);
  const [loadError, setLoadError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    type: 'testimonial', 
    title: '', 
    content: '', 
    is_active: true, 
    expires_at: '' 
  });

  useEffect(() => {
    let mounted = true;
    getMaterials()
      .then((savedMaterials) => {
        if (mounted) setMaterials(savedMaterials);
      })
      .catch((error) => {
        if (mounted) setLoadError(error);
      });

    return () => { mounted = false; };
  }, []);

  const updateFormData = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const addOrUpdateMaterial = useCallback(() => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingId) {
      setMaterials(prev => prev.map(m => m.id === editingId ? { ...formData, id: editingId } : m));
    } else {
      setMaterials(prev => [...prev, { ...formData, id: Date.now() }]);
    }
    
    setEditingId(null);
    setFormData({ type: 'testimonial', title: '', content: '', is_active: true, expires_at: '' });
  }, [editingId, formData]);

  const editMaterial = useCallback((mat) => {
    setEditingId(mat.id);
    setFormData(mat);
  }, []);

  const deleteMaterial = useCallback((id) => {
    setMaterials(prev => prev.filter(m => m.id !== id));
  }, []);

  const cancelEdit = useCallback(() => {
    setEditingId(null);
    setFormData({ type: 'testimonial', title: '', content: '', is_active: true, expires_at: '' });
  }, []);

  return {
    materials,
    editingId,
    formData,
    updateFormData,
    addOrUpdateMaterial,
    editMaterial,
    deleteMaterial,
    cancelEdit,
    loadError,
  };
}