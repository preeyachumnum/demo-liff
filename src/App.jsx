import { useState, useEffect } from 'react';
import liff from '@line/liff';
import Swal from 'sweetalert2';

const App = () => {
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initializing, setInitializing] = useState(true);
    const [formData, setFormData] = useState({
        fullName: '',
        birthDate: '',
        phone: '',
        address: '',
        note: '',
        consent: false
    });

    // --- ตั้งค่า URL และ LIFF ID ของคุณที่นี่ ---
    const GAS_URL = "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL";
    const LIFF_ID = "YOUR_LIFF_ID";

    useEffect(() => {
        const initLiff = async () => {
            try {
                await liff.init({ liffId: LIFF_ID });
                if (liff.isLoggedIn()) {
                    const userProfile = await liff.getProfile();
                    setProfile(userProfile);
                } else {
                    liff.login();
                }
            } catch (err) {
                console.error("LIFF Init Error:", err);
                Swal.fire('ข้อผิดพลาด', 'ไม่สามารถเชื่อมต่อระบบ LINE ได้ กรุณาลองใหม่', 'error');
            } finally {
                setInitializing(false);
            }
        };
        
        initLiff();
    }, []);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const validatePhone = (phone) => {
        const regex = /^[0-9]{10}$/;
        return regex.test(phone);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validatePhone(formData.phone)) {
            Swal.fire('รูปแบบไม่ถูกต้อง', 'กรุณากรอกเบอร์โทรศัพท์เป็นตัวเลข 10 หลักเท่านั้น', 'warning');
            return;
        }

        if (!formData.consent) {
            Swal.fire('กรุณายืนยัน', 'คุณต้องยอมรับเงื่อนไข PDPA ก่อนกดยืนยันข้อมูล', 'warning');
            return;
        }

        setLoading(true);

        const payload = {
            ...formData,
            userId: profile?.userId || 'Unknown',
            displayName: profile?.displayName || 'Unknown',
            timestamp: new Date().toISOString()
        };

        try {
            const response = await fetch(GAS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.status === 'success') {
                await Swal.fire({
                    title: 'สำเร็จ!',
                    text: 'บันทึกข้อมูลเรียบร้อย',
                    icon: 'success',
                    confirmButtonColor: '#10B981'
                });
                liff.closeWindow();
            } else {
                throw new Error(result.message || 'Unknown error from GAS');
            }
        } catch (error) {
            console.error("Submit Error:", error);
            Swal.fire({
                title: 'ข้อผิดพลาด',
                text: 'ไม่สามารถบันทึกข้อมูลได้ กรุณาลองใหม่อีกครั้ง',
                icon: 'error',
                confirmButtonColor: '#EF4444'
            });
        } finally {
            setLoading(false);
        }
    };

    if (initializing) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-green-500 mb-4"></div>
                <p className="text-gray-500 font-medium">กำลังโหลดข้อมูล...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 flex justify-center items-start">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden mt-4">
                <div className="bg-gradient-to-r from-green-500 to-green-600 px-6 py-8 text-center text-white">
                    <h2 className="text-2xl font-bold mb-2">ลงทะเบียนรับสิทธิ์</h2>
                    <p className="text-green-100 text-sm">กรุณากรอกข้อมูลเพื่อใช้ในการจัดส่งสินค้า</p>
                </div>

                {profile && (
                    <div className="px-6 pt-6 flex items-center gap-3">
                        <img src={profile.pictureUrl || 'https://via.placeholder.com/150'} alt="Profile" className="w-10 h-10 rounded-full border border-gray-200" />
                        <div>
                            <p className="text-xs text-gray-400">เข้าสู่ระบบด้วยชื่อ</p>
                            <p className="text-sm font-semibold text-gray-700">{profile.displayName}</p>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อ-นามสกุล <span className="text-red-500">*</span></label>
                        <input 
                            type="text" 
                            name="fullName"
                            required
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                            placeholder="นาย สมชาย ใจดี"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">วันเดือนปีเกิด <span className="text-red-500">*</span></label>
                        <input 
                            type="date" 
                            name="birthDate"
                            required
                            value={formData.birthDate}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">เบอร์โทรศัพท์ <span className="text-red-500">*</span></label>
                        <input 
                            type="tel" 
                            name="phone"
                            required
                            maxLength="10"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition"
                            placeholder="0812345678"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">ที่อยู่จัดส่ง <span className="text-red-500">*</span></label>
                        <textarea 
                            name="address"
                            required
                            rows="3"
                            value={formData.address}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
                            placeholder="บ้านเลขที่ หมู่ ซอย ถนน แขวง เขต จังหวัด รหัสไปรษณีย์"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">หมายเหตุ (ถ้ามี)</label>
                        <textarea 
                            name="note"
                            rows="2"
                            value={formData.note}
                            onChange={handleChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none transition resize-none"
                            placeholder="ฝากไว้ที่ป้อมยาม, โทรหาก่อนส่ง ฯลฯ"
                        ></textarea>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <div className="flex items-center h-5">
                                <input 
                                    type="checkbox" 
                                    name="consent"
                                    checked={formData.consent}
                                    onChange={handleChange}
                                    className="w-5 h-5 text-green-600 bg-white border-gray-300 rounded focus:ring-green-500 cursor-pointer"
                                />
                            </div>
                            <div className="text-sm">
                                <p className="font-medium text-gray-900">ความยินยอม PDPA <span className="text-red-500">*</span></p>
                                <p className="text-gray-500 mt-1">ข้าพเจ้ายินยอมให้เก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลที่ระบุไว้ เพื่อวัตถุประสงค์ในการติดต่อและจัดส่งสินค้า</p>
                            </div>
                        </label>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-3 px-4 rounded-xl text-white font-semibold text-lg transition-all shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
                            ${loading 
                                ? 'bg-gray-400 cursor-not-allowed' 
                                : 'bg-green-600 hover:bg-green-700 hover:shadow-lg transform active:scale-[0.98]'
                            }`}
                    >
                        {loading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                กำลังบันทึกข้อมูล...
                            </span>
                        ) : (
                            'ส่งข้อมูล'
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default App;
