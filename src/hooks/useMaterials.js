import { useState, useCallback, useEffect } from 'react';
import { mockMaterials } from '../services/mockPreferences';
import { getMaterials } from '../services/settingsService';

function cloneValue(value) {
  if (value === undefined) return undefined;
  return JSON.parse(JSON.stringify(value));
}

function areValuesEqual(left, right) {
  if (left === right) return true;
  if (left === null || right === null || left === undefined || right === undefined) return false;

  if (Array.isArray(left) || Array.isArray(right)) {
    if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
    return left.every((item, index) => areValuesEqual(item, right[index]));
  }

  if (typeof left !== 'object' || typeof right !== 'object') return false;

  const leftKeys = Object.keys(left);
  const rightKeys = Object.keys(right);
  if (leftKeys.length !== rightKeys.length) return false;

  return leftKeys.every((key) => Object.prototype.hasOwnProperty.call(right, key) && areValuesEqual(left[key], right[key]));
}

export function useMaterials() {
  const [materials, setMaterials] = useState(mockMaterials);
  const [savedMaterials, setSavedMaterials] = useState(mockMaterials);
  const [loadError, setLoadError] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ 
    type: 'testimonial', 
    title: '', 
    content: '', 
    is_active: true, 
    expires_at: '' 
  });

  const isDirty = !areValuesEqual(materials, savedMaterials);

  useEffect(() => {
    let mounted = true;
    getMaterials()
      .then((savedMaterialsFromDb) => {
        if (mounted) {
          setMaterials(savedMaterialsFromDb);
          setSavedMaterials(cloneValue(savedMaterialsFromDb));
        }
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

  const markSaved = useCallback(() => {
    setSavedMaterials(cloneValue(materials));
  }, [materials]);

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
    isDirty,
    markSaved,
  };
}