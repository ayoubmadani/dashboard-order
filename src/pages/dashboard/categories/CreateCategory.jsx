import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Plus, Layers, Edit3, 
  Trash2, ChevronRight, 
  Hash, X, Save, Image as ImageIcon,
  AlertCircle
} from 'lucide-react';

const Categories = () => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  // State for categories
  const [categories, setCategories] = useState([
    { id: 1, name: "إلكترونيات", slug: "electronics", count: 24, icon: "💻" },
    { id: 2, name: "ملابس رجالية", slug: "mens-wear", count: 12, icon: "👕" },
    { id: 3, name: "إكسسوارات منزلية", slug: "home-decor", count: 8, icon: "🏠" },
    { id: 4, name: "العطور", slug: "perfumes", count: 15, icon: "✨" },
  ]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    icon: '',
    description: ''
  });
  
  const [errors, setErrors] = useState({});

  // Generate slug from name
  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'name' && !editingCategory ? { slug: generateSlug(value) } : {})
    }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = t('validation.nameRequired', 'اسم التصنيف مطلوب');
    }
    if (!formData.slug.trim()) {
      newErrors.slug = t('validation.slugRequired', 'المعرف مطلوب');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Open modal for new category
  const openAddModal = () => {
    setEditingCategory(null);
    setFormData({ name: '', slug: '', icon: '', description: '' });
    setErrors({});
    setIsModalOpen(true);
  };

  // Open modal for editing
  const openEditModal = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      icon: category.icon,
      description: category.description || ''
    });
    setErrors({});
    setIsModalOpen(true);
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    if (editingCategory) {
      // Update existing
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id 
          ? { ...cat, ...formData }
          : cat
      ));
    } else {
      // Add new
      const newCategory = {
        id: Date.now(),
        ...formData,
        count: 0
      };
      setCategories(prev => [...prev, newCategory]);
    }
    setIsModalOpen(false);
  };

  // Delete category
  const handleDelete = (id) => {
    if (window.confirm(t('confirm.delete', 'هل أنت متأكد من الحذف؟'))) {
      setCategories(prev => prev.filter(cat => cat.id !== id));
    }
  };

  // Icon options
  const iconOptions = ['💻', '👕', '🏠', '✨', '👟', '💄', '📱', '🎮', '📚', '🎨', '⚽', '🍎'];

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 transition-colors">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Layers size={24} />
            </div>
            {t('dashboard.categories', 'التصنيفات')}
          </h1>
          <p className="text-gray-500 dark:text-zinc-400 text-sm mt-1">
            {t('categories.manage_desc', 'نظم منتجاتك في مجموعات ليسهل على الزبائن العثور عليها.')}
          </p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 dark:bg-indigo-500 text-white font-black rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all active:scale-95"
        >
          <Plus size={20} />
          {t('categories.add_new', 'إضافة تصنيف جديد')}
        </button>
      </div>

      {/* Grid of Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((cat) => (
          <div key={cat.id} className="bg-white dark:bg-zinc-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-zinc-800 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 dark:hover:shadow-none transition-all group relative overflow-hidden">
            
            <div className="flex items-start justify-between mb-6">
              <div className="w-14 h-14 bg-gray-50 dark:bg-zinc-800 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-inner">
                {cat.icon}
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => openEditModal(cat)}
                  className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-all"
                >
                  <Edit3 size={18} />
                </button>
                <button 
                  onClick={() => handleDelete(cat.id)}
                  className="p-2 text-gray-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-xl transition-all"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className="relative z-10">
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">{cat.name}</h3>
              <div className="flex items-center gap-2 text-gray-400 dark:text-zinc-500 text-xs mb-4 font-mono">
                <Hash size={12} />
                <span>{cat.slug}</span>
              </div>
            </div>

            <div className="pt-5 border-t border-gray-50 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-black uppercase tracking-widest">{t('categories.products_count', 'المنتجات')}</span>
                <span className="text-xl font-black text-indigo-600 dark:text-indigo-400">{cat.count}</span>
              </div>
              <button className="w-11 h-11 rounded-full bg-gray-50 dark:bg-zinc-800 flex items-center justify-center text-gray-400 dark:text-zinc-500 group-hover:bg-indigo-600 dark:group-hover:bg-indigo-500 group-hover:text-white group-hover:translate-x-1 transition-all">
                <ChevronRight size={22} className={isRtl ? 'rotate-180' : ''} />
              </button>
            </div>

            {/* Background effect */}
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl group-hover:bg-indigo-500/10 transition-colors"></div>
          </div>
        ))}

        {/* Empty State / Add Card */}
        <button 
          onClick={openAddModal}
          className="border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 text-gray-400 dark:text-zinc-500 hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/5 transition-all group"
        >
          <div className="w-14 h-14 rounded-full border-2 border-dashed border-gray-300 dark:border-zinc-700 flex items-center justify-center group-hover:rotate-180 group-hover:scale-110 transition-all duration-500 group-hover:border-solid group-hover:bg-indigo-600 group-hover:text-white">
             <Plus size={28} />
          </div>
          <span className="font-black text-sm uppercase tracking-wider">{t('categories.quick_add', 'إضافة سريعة')}</span>
        </button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 dark:border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-xl text-indigo-600 dark:text-indigo-400">
                  <Layers size={20} />
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  {editingCategory 
                    ? t('categories.edit', 'تعديل التصنيف') 
                    : t('categories.add_new', 'تصنيف جديد')}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              
              {/* Icon Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">
                  {t('fields.icon', 'الأيقونة')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {iconOptions.map(icon => (
                    <button
                      key={icon}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, icon }))}
                      className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                        formData.icon === icon 
                          ? 'bg-indigo-600 text-white scale-110 shadow-lg' 
                          : 'bg-gray-50 dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700'
                      }`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">
                  {t('fields.name', 'الاسم')} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('placeholders.categoryName', 'مثال: إلكترونيات')}
                  className={`w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border ${
                    errors.name ? 'border-rose-500' : 'border-gray-100 dark:border-zinc-800'
                  } rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white font-bold`}
                />
                {errors.name && (
                  <div className="flex items-center gap-1 text-rose-500 text-xs">
                    <AlertCircle size={12} />
                    <span>{errors.name}</span>
                  </div>
                )}
              </div>

              {/* Slug Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">
                  {t('fields.slug', 'المعرف الفريد')} *
                </label>
                <div className="relative">
                  <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="electronics"
                    className={`w-full pl-12 pr-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border ${
                      errors.slug ? 'border-rose-500' : 'border-gray-100 dark:border-zinc-800'
                    } rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white font-mono text-sm`}
                  />
                </div>
                {errors.slug && (
                  <div className="flex items-center gap-1 text-rose-500 text-xs">
                    <AlertCircle size={12} />
                    <span>{errors.slug}</span>
                  </div>
                )}
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label className="text-xs font-black text-gray-500 dark:text-zinc-400 uppercase tracking-widest">
                  {t('fields.description', 'الوصف')}
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder={t('placeholders.categoryDesc', 'وصف قصير للتصنيف...')}
                  className="w-full px-5 py-4 bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all dark:text-white resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-zinc-300 font-bold rounded-2xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
                >
                  {t('buttons.cancel', 'إلغاء')}
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none"
                >
                  <Save size={18} />
                  {editingCategory ? t('buttons.update', 'تحديث') : t('buttons.create', 'إنشاء')}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Categories;