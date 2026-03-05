import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { baseURL, storeURL } from '../../../constents/const.';
import { getAccessToken } from '../../../services/access-token';

export default function Theme() {
  const [themes, setThemes] = useState([]);
  const [myTheme, setMyTheme] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [loading, setLoading] = useState(true);

  const token = getAccessToken()
  const storeId = localStorage.getItem('storeId')
  const headers = { headers: { Authorization: `bearer ${token}` } }

  async function getData() {
    setLoading(true);
    try {
      const [themesRes, typesRes, myThemeRes] = await Promise.all([
        axios.get(`${baseURL}/theme`),
        axios.get(`${baseURL}/theme/type`),
        axios.get(`${baseURL}/theme/my`, headers),   // replace with your real endpoint
      ]);

      console.log([themesRes, typesRes, myThemeRes]);


      setThemes(themesRes.data.data ?? []);
      setTypes(typesRes.data ?? []);
      setMyTheme(myThemeRes.data ?? []);
    } catch (err) {
      console.error('Failed to load themes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { getData(); }, []);

  // Filter by themeTypeId (matches the entity)
  const filteredThemes =
    selectedType === 'all'
      ? themes
      : themes.filter(t => t.themeTypeId === selectedType);

  if (loading) {
    return (
      <div className="w-full h-[calc(100vh-130px)] flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  const handleInstallTheme = async (themeId) => {
    try {
      if (!themeId) return;

      // إرسال الطلب (استخدام headers مباشرة كما اتفقنا)
      const { data } = await axios.get(
        `${baseURL}/theme/install-theme/${themeId}`,
        headers
      );

      // بما أن السيرفر يعيد { success: false, message: '...' } مع Status 200
      if (data.success === false) {
        // إظهار رسالة الخطأ للمستخدم (استخدم alert أو toast)
        alert(`خطأ: ${data.message}`);
        return;
      }

      // إذا نجح التثبيت
      alert("تم تثبيت الثيم بنجاح!");
      getData(); // تحديث القائمة فوراً

    } catch (error) {
      // هذه الـ catch ستعمل فقط إذا انقطع الاتصال أو حدث خطأ 500 في السيرفر
      console.error("Connection error:", error.message);
    }
  };

  const handleActiveTheme = async (themeId) => {
    console.log(themeId);  
    try {
      if (!storeId) {
        alert("لم يتم العثور على متجر لتفعيل الثيم عليه");
        return;
      }

      const { data } = await axios.post(
        `${baseURL}/theme/active-theme`,
        { themeId, storeId },
        headers
      );

      if (data.success) {
        alert("تم تفعيل الثيم بنجاح!");
        // يمكنك هنا تحديث واجهة المستخدم أو عمل ريفريش بسيط
        getData();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Activation failed:", error);
      alert("حدث خطأ أثناء تفعيل الثيم");
    }
  };


  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-8">

      {/* ── My Themes ──────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">My Theme</h2>
        <div className="flex flex-wrap gap-6">
          <div className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={'https://bloomidea.com/sites/default/files/styles/og_image/public/blog/Tipos%20de%20come%CC%81rcio%20electro%CC%81nico_0.png?itok=jC9MlQZq'}
                  alt={'default'}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <span className="text-sm text-gray-600 font-medium">default</span>
              <button onClick={()=> handleActiveTheme()} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Activate
              </button>
            </div>
          {myTheme.map((item) => (
            <div key={item.id} className="flex flex-col items-center gap-3">
              <div className="w-32 h-32 bg-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                <img
                  src={item.imageUrl}
                  alt={item.name_en}
                  className="w-full h-full object-cover"
                  onError={e => { e.target.style.display = 'none'; }}
                />
              </div>
              <span className="text-sm text-gray-600 font-medium">{item.name_en}</span>
              <button onClick={()=> handleActiveTheme(item.id)} className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                Activate
              </button>
            </div>
          ))}

          {/* Empty placeholder slots */}

        </div>
      </section>

      {/* ── Type Filter ────────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Type</h2>
        <div className="flex flex-wrap gap-3">
          {/* "All" pill */}
          <button
            onClick={() => setSelectedType('all')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedType === 'all'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            All
          </button>

          {/* Dynamic type pills from API */}
          {types.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${selectedType === type.id
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {type.name}
            </button>
          ))}
        </div>
      </section>

      {/* ── Theme Gallery ──────────────────────────────────────────────────── */}
      <section className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Themes</h2>
          <span className="text-sm text-gray-400">{filteredThemes.length} result{filteredThemes.length !== 1 ? 's' : ''}</span>
        </div>

        {filteredThemes.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No themes found</p>
            <p className="text-sm mt-1">Try selecting a different type</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredThemes.map((item) => (
              <div
                key={item.id}
                className="group bg-gray-50 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 border border-gray-100"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name_en}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-4xl">◈</div>
                  )}

                  {/* Price badge */}
                  <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-semibold text-gray-800 shadow-sm">
                    {Number(item.price) === 0 ? 'Free' : `$${Number(item.price).toFixed(2)}`}
                  </div>

                  {/* Free badge */}
                  {Number(item.price) === 0 && (
                    <div className="absolute top-3 left-3 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                      FREE
                    </div>
                  )}
                </div>

                {/* Body */}
                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-800 mb-1">{item.name_en || item.name_ar}</h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-2">{item.desc_en}</p>

                  {/* Tags */}
                  {Array.isArray(item.tag) && item.tag.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tag.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded-md">
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3">
                    <a target='_blank'  href={`${storeURL}/show/${item.slug}`} className="flex flex-1 justify-center bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                      Preview
                    </a>
                    <button onClick={() => handleInstallTheme(item.id)} className="flex-1 bg-gray-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-900 transition-colors shadow-sm">
                      Install
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
}