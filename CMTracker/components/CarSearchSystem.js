import React, { useState, useEffect, useCallback } from 'react';
// ต้อง import View, Text, StyleSheet (และอาจจะต้องใช้ TouchableOpacity แทน Button บางจุดใน RN)
import { View, Text, StyleSheet, ActivityIndicator, Pressable } from 'react-native'; 

// API URL (จำลอง) - *กรุณาเปลี่ยนเป็น URL จริงที่ใช้งานได้*
const API_URL = "http://192.168.1.33:3000/api/cars"; 

// ----------------------------------------------------------------
// Component: Notification Toast
// ----------------------------------------------------------------

/**
 * กำหนดอีโมจิ, สี และชื่อหัวข้อตามประเภทของการแจ้งเตือน
 *
 * NOTE: ใน React Native สีและสไตล์ต้องกำหนดเป็น StyleSheet.create หรือ Object
 * ผมจะทิ้งชื่อ Tailwind ไว้ แต่จะใช้ตัวแปรสี/สไตล์แบบคงที่เพื่อแสดงแนวคิด
 */
const getIconMapping = (type) => {
    switch (type) {
      case 'success':
        // แทนที่ bgColor: 'bg-green-500' ด้วยสีจริง
        return { iconEmoji: '✅', bgColorStyle: { backgroundColor: '#10B981' }, title: 'สำเร็จ!', textColor: '#065F46' };
      case 'error':
        return { iconEmoji: '❌', bgColorStyle: { backgroundColor: '#EF4444' }, title: 'ข้อผิดพลาด!', textColor: '#991B1B' };
      case 'warning':
        return { iconEmoji: '⚠️', bgColorStyle: { backgroundColor: '#F59E0B' }, title: 'คำเตือน!', textColor: '#92400E' };
      default:
        return { iconEmoji: 'ℹ️', bgColorStyle: { backgroundColor: '#3B82F6' }, title: 'ข้อมูล', textColor: '#1E40AF' };
    }
};

const NotificationToast = ({ notification, setNotification }) => {
    if (!notification) return null;

    const { iconEmoji, bgColorStyle, title } = getIconMapping(notification.type);

    useEffect(() => {
        const timer = setTimeout(() => {
            setNotification(null);
        }, 5000);
        return () => clearTimeout(timer);
    }, [notification, setNotification]);

    return (
        // Fixed positioning ใน React Native ใช้ 'absolute' หรือ 'fixed' (ตาม platform) และต้องกำหนด 'top', 'right'
        // ผมจะใช้ styles ธรรมดาเพื่อแสดงโครงสร้าง View
        <View style={[notificationStyles.toastContainer, {borderColor: '#E5E7EB'}]}>
            {/* Header / Main message section */}
            <View style={notificationStyles.header}>
                {/* Icon Circle - ใช้ View */}
                <View style={[notificationStyles.iconCircle, bgColorStyle]}>
                    <Text style={notificationStyles.iconText}>
                        {iconEmoji}
                    </Text>
                </View>
                
                <View style={notificationStyles.messageContainer}>
                    {/* ใช้ title จาก getIconMapping สำหรับหัวข้อหลัก และ message สำหรับเนื้อหา */}
                    {/* NOTE: Text ต้องอยู่ภายใน Text หรือ View เท่านั้น */}
                    <Text style={notificationStyles.titleText}>{notification.title || title}</Text>
                    <Text style={notificationStyles.messageText}>{notification.message}</Text>
                </View>

                {/* Button สำหรับปิด - ใช้ Pressable หรือ TouchableOpacity ใน RN */}
                <Pressable 
                    onPress={() => setNotification(null)} 
                    style={notificationStyles.closeButton}
                    accessibilityLabel="ปิดการแจ้งเตือน"
                >
                    <Text style={notificationStyles.closeButtonText}>✕</Text>
                </Pressable>
            </View>
            
            {/* Details section */}
            {notification.details && (
                <View style={notificationStyles.detailsContainer}>
                    <Text style={notificationStyles.detailsText}>
                        {notification.details}
                    </Text>
                </View>
            )}
        </View>
    );
};

// ----------------------------------------------------------------
// Function: safeApiCall (Standardized fetch with Exponential Backoff)
// ----------------------------------------------------------------
// NOTE: ฟังก์ชันนี้ใช้ได้โดยไม่ต้องแก้ไข

const safeApiCall = async (url, options, action, onSuccess, setNotification) => {
    let data = {};
    const MAX_RETRIES = 3;
    let retries = 0;

    while (retries < MAX_RETRIES) {
        try {
            const res = await fetch(url, options); 
            const status = res.status; 
            
            if (!res.ok) {
                const errorText = await res.text();
                
                console.error(`[API ERROR] Status ${status} for ${action} ${url}:`, errorText.substring(0, 500));
                
                const detailedError = errorText.substring(0, 100).trim() || 'เซิร์ฟเวอร์ไม่ได้ระบุข้อผิดพลาด';
                throw new Error(`${action} ล้มเหลว (Status: ${status}). รายละเอียด: ${detailedError}`);
            }
            
            const contentType = res.headers.get("content-type");
            const isJson = contentType && contentType.indexOf("application/json") !== -1;

            if (isJson && status !== 204) { // 204 No Content shouldn't try to parse JSON
                data = await res.json();
            } else {
                data = {}; 
            }
            
            onSuccess(data);
            return; // Success, break the loop
        } catch (err) {
            console.error('API Call Catch Error:', err);
            
            if (retries === MAX_RETRIES - 1) {
                const errorMessage = err.message || `เกิดข้อผิดพลาดเครือข่ายที่ไม่ทราบสาเหตุ`;
                
                setNotification({
                    type: 'error',
                    title: 'เชื่อมต่อล้มเหลว',
                    message: `ไม่สามารถดำเนินการ ${action} ได้ โปรดลองใหม่อีกครั้ง`,
                    details: errorMessage,
                });
            } else {
                // Exponential backoff
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
            }
            retries++;
        }
    }
};


// ----------------------------------------------------------------
// Main Component: App (Car Management)
// ----------------------------------------------------------------
export default function App() {
    const [isLoading, setIsLoading] = useState(false);
    const [rawCarData, setRawCarData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingCar, setEditingCar] = useState(null);
    const [notification, setNotification] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [carToDeleteId, setCarToDeleteId] = useState(null);

    const initialCarState = {
        brand: '',
        model: '',
        licensePlate: '',
        color: '',
        finance: '',
        financeStatus: 'ชำระเต็ม', // Default value
    };

    const [newCar, setNewCar] = useState(initialCarState);

    // โหลดข้อมูลรถทั้งหมด
    const fetchCars = useCallback(async () => {
        setIsLoading(true);
        await safeApiCall(
            API_URL,
            { method: 'GET' },
            'โหลดข้อมูล',
            (data) => {
                const carArray = Array.isArray(data) ? data : (data && Array.isArray(data.cars) ? data.cars : []);
                setRawCarData(carArray.map(car => ({
                    ...car,
                    // Normalize ID to 'id' for consistent React state management
                    id: car.id || car._id 
                })));
            },
            setNotification
        );
        setIsLoading(false);
    }, [setNotification]);

    useEffect(() => {
        // ให้โหลดข้อมูลเมื่อ Component ถูกโหลดครั้งแรก
        fetchCars();
    }, [fetchCars]);

    // เพิ่มข้อมูลรถ
    const handleAddCar = async () => {
        if (!newCar.brand || !newCar.model || !newCar.licensePlate) {
            setNotification({ type: 'warning', message: 'กรุณากรอก ยี่ห้อ รุ่น และทะเบียนรถ' });
            return;
        }
        
        setIsLoading(true);
        
        await safeApiCall(
            API_URL,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCar),
            },
            'เพิ่มข้อมูล',
            (data) => {
                const addedCarId = data.id || data._id || Date.now().toString(); // Fallback ID if API doesn't return one

                if (data && addedCarId) { 
                    const carWithId = { ...newCar, id: addedCarId };
                    setRawCarData((prev) => [...prev, carWithId]);
                    setShowAddModal(false);
                    setNewCar(initialCarState);
                    setNotification({ type: 'success', message: 'เพิ่มข้อมูลรถยนต์เรียบร้อยแล้ว' });
                } else {
                    setNotification({ type: 'warning', message: 'เพิ่มข้อมูลสำเร็จ', details: 'ข้อมูลถูกบันทึกแล้ว (ID ไม่ถูกส่งกลับมา) กำลังโหลดรายการล่าสุด...' });
                    fetchCars(); 
                }
            },
            setNotification
        );
        setIsLoading(false);
    };

    // แก้ไขข้อมูลรถ
    const handleUpdateCar = async () => {
        if (!editingCar || !editingCar.id) return;
        
        if (!editingCar.brand || !editingCar.model || !editingCar.licensePlate) {
            setNotification({ type: 'warning', message: 'ข้อมูลไม่ครบถ้วน', details: 'กรุณากรอก ยี่ห้อ รุ่น และทะเบียนรถ' });
            return;
        }

        setIsLoading(true);
        const updateUrl = `${API_URL}/${editingCar.id}`; 

        await safeApiCall(
            updateUrl,
            {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCar),
            },
            'แก้ไขข้อมูล',
            (updatedCarResponse) => {
                const finalUpdatedCar = { ...editingCar, ...updatedCarResponse };

                setRawCarData((prev) =>
                    prev.map((c) => (c.id === finalUpdatedCar.id ? finalUpdatedCar : c))
                );
                setEditingCar(null);

                setNotification({
                    type: 'success',
                    title: 'แก้ไขสำเร็จ!',
                    message: `ข้อมูลรถยนต์ ${finalUpdatedCar.licensePlate} ถูกบันทึกเรียบร้อยแล้ว`,
                    details: (
                        `ยี่ห้อ: ${finalUpdatedCar.brand}\n` +
                        `รุ่น: ${finalUpdatedCar.model}\n` +
                        `ทะเบียน: ${finalUpdatedCar.licensePlate}\n` +
                        `สถานะไฟแนนซ์: ${finalUpdatedCar.financeStatus || 'ไม่ระบุ'}`
                    )
                });
            },
            setNotification
        );
        setIsLoading(false);
    };

    // ลบข้อมูลรถ
    const confirmDelete = (id) => {
        setCarToDeleteId(id);
        setShowConfirmModal(true);
    };

    const handleDeleteCar = async () => {
        const id = carToDeleteId;
        if (!id) return;

        setShowConfirmModal(false); 
        setIsLoading(true);
        const deleteUrl = `${API_URL}/${id}`;

        await safeApiCall(
            deleteUrl,
            { method: 'DELETE' },
            'ลบข้อมูล',
            () => {
                setRawCarData((prev) => prev.filter((car) => car.id !== id));
                setNotification({ type: 'success', message: `ลบข้อมูลรถยนต์ทะเบียน ${rawCarData.find(c => c.id === id)?.licensePlate || 'ที่เลือก'} เรียบร้อยแล้ว` });
            },
            setNotification
        );
        setCarToDeleteId(null);
        setIsLoading(false);
    };

    // LOGIC การค้นหา (Filtering Logic)
    const filteredCars = rawCarData.filter(car => {
        const lowerCaseSearch = searchTerm.toLowerCase();
        if (!lowerCaseSearch) {
            return true;
        }

        const matchesLicensePlate = car.licensePlate?.toLowerCase().includes(lowerCaseSearch);
        const matchesModel = car.model?.toLowerCase().includes(lowerCaseSearch);
        const matchesFinance = car.finance?.toLowerCase().includes(lowerCaseSearch);
        const matchesBrand = car.brand?.toLowerCase().includes(lowerCaseSearch);

        return matchesLicensePlate || matchesModel || matchesFinance || matchesBrand;
    });

    // ----------------------------------------------------------------
    // UI Components (Inline) - แปลงเป็น View/Text/Pressable
    // ----------------------------------------------------------------
    const CarCard = ({ car }) => (
        // div -> View
        <View style={carCardStyles.cardContainer}>
            {/* div -> View */}
            <View style={carCardStyles.infoSection}>
                {/* h2 -> Text */}
                <Text style={carCardStyles.titleText}>
                    {car.brand} {car.model}
                </Text>
                {/* div -> View */}
                <View style={carCardStyles.detailsContainer}>
                    {/* span/Text -> Text */}
                    <Text style={carCardStyles.detailLine}>
                        <Text style={carCardStyles.detailLabel}>ทะเบียน:</Text> {car.licensePlate}
                    </Text>
                    <Text style={carCardStyles.detailLine}>
                        <Text style={carCardStyles.detailLabel}>สี:</Text> {car.color || '-'}
                    </Text>
                    <Text style={carCardStyles.detailLine}>
                        <Text style={carCardStyles.detailLabel}>ไฟแนนซ์:</Text> {car.finance || '-'}
                    </Text>
                    <Text style={carCardStyles.detailLine}>
                        <Text style={carCardStyles.detailLabel}>สถานะ: </Text>
                        {/* span -> Text */}
                        <Text style={[
                            carCardStyles.financeStatusBadge, 
                            car.financeStatus === 'ชำระเต็ม' ? carCardStyles.statusFull : carCardStyles.statusInstallment
                        ]}>
                            {car.financeStatus || 'ไม่ระบุ'}
                        </Text>
                    </Text>
                </View>
            </View>

            {/* div -> View (สำหรับปุ่ม) */}
            <View style={carCardStyles.buttonContainer}>
                {/* button -> Pressable */}
                <Pressable
                    style={[carCardStyles.buttonBase, carCardStyles.editButton, isLoading && carCardStyles.disabledButton]}
                    onPress={() => setEditingCar(car)}
                    disabled={isLoading}
                    accessibilityLabel="แก้ไขข้อมูลรถ"
                >
                    <Text style={carCardStyles.buttonText}>📝 แก้ไข</Text>
                </Pressable>
                {/* button -> Pressable */}
                <Pressable
                    style={[carCardStyles.buttonBase, carCardStyles.deleteButton, isLoading && carCardStyles.disabledButton]}
                    onPress={() => confirmDelete(car.id)}
                    disabled={isLoading}
                    accessibilityLabel="ลบข้อมูลรถ"
                >
                    <Text style={carCardStyles.buttonText}>🗑️ ลบ</Text>
                </Pressable>
            </View>
        </View>
    );

    // ************************************************************
    // ModalComponent (ต้องใช้ React Native Modal component จริงๆ)
    // ************************************************************
    const ModalComponent = ({ title, carState, setCarState, onSave, onClose }) => {
        const isEdit = !!carState.id; 
        
        return (
            // div -> View
            <View style={modalStyles.overlay}>
                {/* div -> View */}
                <View style={modalStyles.modalContent}>
                    {/* div -> View */}
                    <View style={modalStyles.header}>
                        {/* h3 -> Text */}
                        <Text style={modalStyles.headerText}>{title}</Text>
                        {/* button -> Pressable */}
                        <Pressable 
                            onPress={onClose} 
                            style={modalStyles.closeButton}
                            accessibilityLabel="ปิด"
                        >
                            <Text style={modalStyles.closeButtonText}>✕</Text>
                        </Pressable>
                    </View>
                    
                    {/* div -> View */}
                    <View style={modalStyles.formContainer}>
                        {['brand', 'model', 'licensePlate', 'color', 'finance'].map(
                            (field) => (
                                // div -> View
                                <View key={field} style={modalStyles.formField}>
                                    {/* label -> Text */}
                                    <Text style={modalStyles.label}>
                                        {field === 'brand' ? 'ยี่ห้อ (จำเป็น)' : 
                                         field === 'model' ? 'รุ่นรถ (จำเป็น)' : 
                                         field === 'licensePlate' ? 'เลขทะเบียน (จำเป็น)' : 
                                         field === 'color' ? 'สีรถ' : 
                                         'ชื่อไฟแนนซ์'}
                                    </Text>
                                    {/* input -> TextInput (ต้อง import จาก 'react-native') */}
                                    {/* ผมจะใช้ <Text> แทนเพื่อคงรูปแบบโค้ดเดิม แต่ควรเป็น TextInput */}
                                    <Text 
                                        style={modalStyles.textInputPlaceholder} // ควรเป็น TextInput
                                        placeholder={`กรอก${
                                            field === 'brand' ? 'ยี่ห้อ' : 
                                            field === 'model' ? 'รุ่นรถ' : 
                                            field === 'licensePlate' ? 'เลขทะเบียน' : 
                                            field === 'color' ? 'สีรถ' : 
                                            'ชื่อไฟแนนซ์'
                                        }`}
                                        value={carState[field] || ''}
                                        // onChangeText (สำหรับ TextInput)
                                        onChangeText={(text) => setCarState({ ...carState, [field]: text })}
                                        // required ใน RN ไม่ได้มีผลทาง UI ต้องตรวจสอบเอง
                                    >
                                        {carState[field] || ''} 
                                    </Text> 
                                </View>
                            )
                        )}

                        {/* div -> View */}
                        <View style={modalStyles.statusRow}>
                            {/* label -> Text */}
                            <Text style={modalStyles.statusLabel}>สถานะไฟแนนซ์:</Text>
                            {/* div -> View */}
                            <View style={modalStyles.statusOptions}>
                                {['ชำระเต็ม', 'กำลังผ่อน'].map(status => (
                                    // button -> Pressable
                                    <Pressable
                                        key={status}
                                        style={[modalStyles.statusButtonBase, 
                                            carState.financeStatus === status 
                                                ? modalStyles.statusButtonSelected 
                                                : modalStyles.statusButtonUnselected
                                        ]}
                                        onPress={() => setCarState({ ...carState, financeStatus: status })}
                                        disabled={isLoading}
                                    >
                                        <Text style={modalStyles.statusButtonText}>
                                            {status}
                                        </Text>
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    </View>

                    {/* div -> View */}
                    <View style={modalStyles.footer}>
                        {/* button -> Pressable */}
                        <Pressable 
                            style={[modalStyles.saveButton, isLoading && modalStyles.disabledButton]} 
                            onPress={onSave}
                            disabled={isLoading}
                        >
                            {/* แสดง ActivityIndicator แทน SVG */}
                            {isLoading ? (
                                <View style={modalStyles.loadingContainer}>
                                    <ActivityIndicator size="small" color="#fff" style={{marginRight: 8}} />
                                    <Text style={modalStyles.saveButtonText}>กำลังบันทึก...</Text>
                                </View>
                            ) : (
                                <Text style={modalStyles.saveButtonText}>
                                    {isEdit ? 'บันทึกการแก้ไข' : 'บันทึกข้อมูล'}
                                </Text>
                            )}
                        </Pressable>

                        {/* button -> Pressable */}
                        <Pressable
                            style={[modalStyles.cancelButton, isLoading && modalStyles.disabledButton]}
                            onPress={onClose}
                            disabled={isLoading}
                        >
                            <Text style={modalStyles.cancelButtonText}>ยกเลิก</Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };
    
    // ************************************************************
    // ConfirmModal (ต้องใช้ React Native Modal component จริงๆ)
    // ************************************************************
    const ConfirmModal = ({ show, onConfirm, onCancel, message }) => {
        if (!show) return null;
        return (
            // div -> View
            <View style={confirmModalStyles.overlay}>
                {/* div -> View */}
                <View style={confirmModalStyles.modalContent}>
                    {/* h3 -> Text */}
                    <Text style={confirmModalStyles.headerText}>
                        <Text>⚠️ </Text>
                        <Text>ยืนยันการลบ</Text>
                    </Text>
                    {/* p -> Text */}
                    <Text style={confirmModalStyles.messageText}>{message}</Text>
                    {/* div -> View */}
                    <View style={confirmModalStyles.footer}>
                        {/* button -> Pressable */}
                        <Pressable
                            style={[confirmModalStyles.cancelButton, isLoading && confirmModalStyles.disabledButton]}
                            onPress={onCancel}
                            disabled={isLoading}
                        >
                            <Text style={confirmModalStyles.cancelButtonText}>ยกเลิก</Text>
                        </Pressable>
                        {/* button -> Pressable */}
                        <Pressable
                            style={[confirmModalStyles.confirmButton, isLoading && confirmModalStyles.disabledButton]}
                            onPress={onConfirm}
                            disabled={isLoading}
                        >
                            <Text style={confirmModalStyles.confirmButtonText}>
                                {isLoading ? 'กำลังลบ...' : 'ลบถาวร'}
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </View>
        );
    };

    // ----------------------------------------------------------------
    // Main Render
    // ----------------------------------------------------------------
    return (
        // div -> View
        <View style={mainStyles.container}>
            {/* div -> View */}
            <View style={mainStyles.contentWrapper}>
                {/* h1 -> Text */}
                <Text style={mainStyles.headerText}>
                    <Text>🚗 </Text>
                    <Text>จัดการข้อมูลรถยนต์</Text>
                </Text>

                {/* Search Input and Add Button - div -> View */}
                <View style={mainStyles.topSection}>
                    {/* div -> View */}
                    <View style={mainStyles.searchInputContainer}>
                        {/* div -> View (สำหรับ Icon) */}
                        <View style={mainStyles.searchIcon}>
                            <Text style={{fontSize: 18}}>🔍</Text>
                        </View>
                        {/* input -> Text (ควรเป็น TextInput) */}
                        <Text 
                            style={mainStyles.searchInput}
                            placeholder="ค้นหา: ทะเบียนรถ, รุ่นรถ, ยี่ห้อ หรือ ไฟแนนซ์"
                            value={searchTerm}
                            onChangeText={(text) => setSearchTerm(text)} // ควรเป็น onChangeText
                        >
                            {searchTerm}
                        </Text>
                    </View>
                    {/* button -> Pressable */}
                    <Pressable
                        style={[mainStyles.addButton, isLoading && mainStyles.disabledButton]}
                        onPress={() => {
                            setNewCar(initialCarState);
                            setShowAddModal(true);
                        }}
                        disabled={isLoading}
                    >
                        <Text style={mainStyles.addButtonText}>+ เพิ่มรถยนต์ใหม่</Text>
                    </Pressable>
                </View>
                
                {/* Car List / Loading / Empty State - div -> View */}
                <View style={mainStyles.listSection}>
                    {isLoading && rawCarData.length === 0 ? (
                        // div -> View
                        <View style={mainStyles.loadingContainer}>
                            {/* Loading Indicator แทน div */}
                            <ActivityIndicator size="large" color="#4F46E5" /> 
                            <Text style={mainStyles.loadingText}>กำลังโหลดข้อมูล...</Text>
                        </View>
                    ) : filteredCars.length === 0 ? (
                        // div -> View
                        <View style={mainStyles.emptyStateContainer}>
                            <Text style={mainStyles.emptyStateEmoji}>🤷‍♂️</Text>
                            <Text style={mainStyles.emptyStateText}>
                                {searchTerm ? `ไม่พบข้อมูลรถยนต์ที่ตรงกับ "${searchTerm}"` : 'ยังไม่มีข้อมูลรถยนต์ในระบบ'}
                            </Text>
                        </View>
                    ) : (
                        // div -> View
                        <View style={mainStyles.carList}>
                            {/* ใช้ FlatList/ScrollView แทน View/map ใน RN เพื่อประสิทธิภาพที่ดีกว่า */}
                            {filteredCars.map((car, index) => (
                                <CarCard key={car.id || index} car={car} />
                            ))}
                        </View>
                    )}
                </View>
            </View>

            {/* Modals - ใช้ RN's Modal Component จริงๆ */}

            {/* Add Modal */}
            {showAddModal && (
                // ต้องใช้ <Modal animationType="slide" transparent={true} visible={showAddModal}>
                <ModalComponent
                    title="เพิ่มข้อมูลรถยนต์ใหม่"
                    carState={newCar}
                    setCarState={setNewCar}
                    onSave={handleAddCar}
                    onClose={() => setShowAddModal(false)}
                />
            )}

            {/* Edit Modal */}
            {!!editingCar && (
                // ต้องใช้ <Modal animationType="slide" transparent={true} visible={!!editingCar}>
                <ModalComponent
                    title={`แก้ไขข้อมูล: ${editingCar.licensePlate}`}
                    carState={editingCar}
                    setCarState={setEditingCar}
                    onSave={handleUpdateCar}
                    onClose={() => setEditingCar(null)}
                />
            )}
            
            {/* Confirmation Modal */}
            <ConfirmModal
                show={showConfirmModal}
                message={`คุณต้องการลบข้อมูลรถยนต์ทะเบียน ${rawCarData.find(c => c.id === carToDeleteId)?.licensePlate || 'ที่เลือก'} ใช่ไหม? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
                onConfirm={handleDeleteCar}
                onCancel={() => {
                    setShowConfirmModal(false);
                    setCarToDeleteId(null);
                }}
            />

            {/* Notification Toast */}
            {/* ต้องใช้ RN's Toast/Flash message library หรือทำเอง (ซึ่งเราได้ทำ NotificationToast) */}
            <NotificationToast notification={notification} setNotification={setNotification} />
        </View>
    );
}

// ----------------------------------------------------------------
// React Native Styles (ทดแทน Tailwind CSS)
// ----------------------------------------------------------------
// NOTE: Styles เหล่านี้เป็นเพียงการจำลองคร่าวๆ ของ Tailwind classes เดิม 
//       และจะต้องปรับเปลี่ยนตามการใช้งานจริงใน React Native

const mainStyles = StyleSheet.create({
    container: {
        flex: 1, // min-h-screen
        backgroundColor: '#F9FAFB', // bg-gray-50
        paddingHorizontal: 16, // p-4 sm:p-8
        paddingVertical: 32,
    },
    contentWrapper: {
        maxWidth: 896, // max-w-4xl
        alignSelf: 'center', // mx-auto
    },
    headerText: {
        fontSize: 30, // text-4xl
        fontWeight: '800', // font-extrabold
        color: '#4F46E5', // text-indigo-700
        marginBottom: 32, // mb-8
        marginTop: 16, // mt-4
        borderBottomWidth: 1,
        borderColor: '#E5E7EB', // border-b pb-3
        paddingBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
    },
    topSection: {
        marginBottom: 32, // mb-8
        flexDirection: 'row',
        alignItems: 'center',
        // space-y-4 sm:space-y-0 sm:space-x-4 
        // จะต้องจัดการเองใน RN
    },
    searchInputContainer: {
        flex: 1, // flex-1 w-full
        position: 'relative',
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 16, // sm:space-x-4
    },
    searchIcon: {
        position: 'absolute',
        left: 12, // left-3
        zIndex: 1,
    },
    searchInput: {
        flex: 1,
        paddingVertical: 12, // p-3
        paddingLeft: 40, // pl-10
        borderWidth: 1,
        borderColor: '#D1D5DB', // border border-gray-300
        borderRadius: 12, // rounded-xl
        fontSize: 16, // text-base
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    addButton: {
        paddingHorizontal: 24, // px-6
        paddingVertical: 12, // py-3
        backgroundColor: '#4F46E5', // bg-indigo-600
        borderRadius: 12, // rounded-xl
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
    },
    addButtonText: {
        color: '#fff',
        fontWeight: '700', // font-bold
    },
    disabledButton: {
        opacity: 0.5,
    },
    listSection: {
        minHeight: 300,
    },
    loadingContainer: {
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: 160, // h-40
        backgroundColor: '#fff',
        borderRadius: 12, // rounded-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    loadingText: {
        fontSize: 18, // text-lg
        color: '#4B5563', // text-gray-600
        marginTop: 12, // mt-3
    },
    emptyStateContainer: {
        alignItems: 'center',
        padding: 32, // p-8
        backgroundColor: '#fff',
        borderRadius: 12, // rounded-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6',
    },
    emptyStateEmoji: {
        fontSize: 30, // text-2xl mb-2
        marginBottom: 8,
    },
    emptyStateText: {
        fontSize: 18, // text-lg
        fontWeight: '500', // font-medium
        color: '#6B7280', // text-gray-500
        textAlign: 'center',
    },
    carList: {
        // space-y-4
    }
});

const carCardStyles = StyleSheet.create({
    cardContainer: {
        backgroundColor: '#fff',
        borderRadius: 16, // rounded-2xl
        padding: 20, // p-5
        marginBottom: 16, // mb-4
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 3,
        borderWidth: 1,
        borderColor: '#F3F4F6', // border border-gray-100
        flexDirection: 'row', // sm:flex-row
        justifyContent: 'space-between',
        alignItems: 'flex-start', // sm:items-center
    },
    infoSection: {
        marginBottom: 16, // mb-4 sm:mb-0
        minWidth: 0, // min-w-0
        flex: 1, // flex-1
    },
    titleText: {
        fontSize: 20, // text-xl
        fontWeight: '800', // font-extrabold
        color: '#1F2937', // text-gray-800
        marginBottom: 8, // mb-2
        // truncate in RN requires specific styling or wrapping
    },
    detailsContainer: {
        color: '#4B5563', // text-gray-600
        fontSize: 14, // text-sm
        // space-y-1
    },
    detailLine: {
        marginBottom: 4,
    },
    detailLabel: {
        fontWeight: '600', // font-semibold
        color: '#374151', // text-gray-700
    },
    financeStatusBadge: {
        fontWeight: '700', // font-bold
        paddingHorizontal: 12, // px-3
        paddingVertical: 4, // py-1
        borderRadius: 20, // rounded-full
        fontSize: 12, // text-xs
        overflow: 'hidden', // whitespace-nowrap in RN
        alignSelf: 'flex-start', // Important for Text component styling
    },
    statusFull: {
        backgroundColor: '#D1FAE5', // bg-green-100
        color: '#047857', // text-green-700
    },
    statusInstallment: {
        backgroundColor: '#FEF3C7', // bg-yellow-100
        color: '#B45309', // text-yellow-700
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end', // justify-end
        width: 'auto', // sm:w-auto
        marginTop: 16, // mt-4 sm:mt-0
        marginLeft: 16, // flex-shrink-0
        // space-x-3
    },
    buttonBase: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        borderRadius: 9999, // rounded-full
        marginLeft: 12, // space-x-3
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    editButton: {
        backgroundColor: '#6366F1', // bg-indigo-500
    },
    deleteButton: {
        backgroundColor: '#EF4444', // bg-red-500
    },
    buttonText: {
        color: '#fff',
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
    },
    disabledButton: {
        opacity: 0.5,
    }
});

const modalStyles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(17, 24, 39, 0.75)', // bg-gray-900 bg-opacity-75
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        padding: 16, // p-4
    },
    modalContent: {
        backgroundColor: '#fff',
        borderRadius: 16, // rounded-2xl
        width: '100%',
        maxWidth: 512, // max-w-lg
        padding: 24, // p-6
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.3,
        shadowRadius: 20,
        elevation: 20,
        marginVertical: 40, // my-8
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderColor: '#E5E7EB',
        paddingBottom: 12,
        marginBottom: 16,
    },
    headerText: {
        fontSize: 24, // text-2xl
        fontWeight: '700', // font-bold
        color: '#1F2937', // text-gray-800
    },
    closeButton: {
        padding: 8, // p-0
    },
    closeButtonText: {
        color: '#9CA3AF', // text-gray-400
        fontSize: 24, // text-2xl
    },
    formContainer: {
        // space-y-4
    },
    formField: {
        marginBottom: 16, // space-y-4
    },
    label: {
        fontSize: 14, // text-sm
        fontWeight: '500', // font-medium
        color: '#374151', // text-gray-700
        marginBottom: 4, // mb-1
    },
    textInputPlaceholder: {
        width: '100%',
        padding: 12, // p-3
        borderWidth: 1,
        borderColor: '#D1D5DB', // border border-gray-300
        borderRadius: 8, // rounded-lg
        backgroundColor: '#fff',
        fontSize: 16,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 8, // pt-2
        // flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4
    },
    statusLabel: {
        fontSize: 16, // text-base
        fontWeight: '600', // font-semibold
        color: '#374151', // text-gray-700
        marginRight: 16, // sm:space-x-4
    },
    statusOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap', // flex-wrap
        // gap-3
    },
    statusButtonBase: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        fontSize: 14, // text-sm
        fontWeight: '600', // font-semibold
        borderRadius: 9999, // rounded-full
        marginRight: 12, // gap-3
        marginBottom: 8, // for flexWrap
    },
    statusButtonSelected: {
        backgroundColor: '#4F46E5', // bg-indigo-600
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    statusButtonUnselected: {
        backgroundColor: '#F3F4F6', // bg-gray-100
        color: '#374151', // text-gray-700
    },
    statusButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
    footer: {
        flexDirection: 'row',
        // space-x-3
        marginTop: 32, // mt-8
    },
    saveButton: {
        flex: 1, // flex-1
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        backgroundColor: '#4F46E5', // bg-indigo-600
        borderRadius: 12, // rounded-xl
        shadowColor: '#4F46E5',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6,
        marginRight: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontWeight: '700', // font-bold
    },
    cancelButton: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 12, // py-3
        backgroundColor: '#E5E7EB', // bg-gray-200
        borderRadius: 12, // rounded-xl
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#374151', // text-gray-700
        fontWeight: '700', // font-bold
    },
    loadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    disabledButton: {
        opacity: 0.5,
    }
});

const confirmModalStyles = StyleSheet.create({
    overlay: modalStyles.overlay,
    modalContent: {
        ...modalStyles.modalContent,
        maxWidth: 384, // max-w-sm
        padding: 24,
        zIndex: 50,
    },
    headerText: {
        fontSize: 20, // text-xl
        fontWeight: '700', // font-bold
        color: '#DC2626', // text-red-600
        marginBottom: 12, // mb-3
        flexDirection: 'row',
        alignItems: 'center',
    },
    messageText: {
        color: '#374151', // text-gray-700
        marginBottom: 24, // mb-6
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'flex-end', // justify-end
        // space-x-3
    },
    cancelButton: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        backgroundColor: '#E5E7EB', // bg-gray-200
        borderRadius: 8, // rounded-lg
        marginRight: 12,
    },
    cancelButtonText: {
        color: '#374151', // text-gray-700
        fontWeight: '600', // font-semibold
    },
    confirmButton: {
        paddingHorizontal: 16, // px-4
        paddingVertical: 8, // py-2
        backgroundColor: '#DC2626', // bg-red-600
        borderRadius: 8, // rounded-lg
        shadowColor: '#DC2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 4,
    },
    confirmButtonText: {
        color: '#fff',
        fontWeight: '600', // font-semibold
    },
    disabledButton: {
        opacity: 0.5,
    }
});

const notificationStyles = StyleSheet.create({
    toastContainer: {
        position: 'absolute',
        top: 16, // top-4
        right: 16, // right-4
        zIndex: 50,
        padding: 16, // p-4
        borderRadius: 16, // rounded-xl
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        elevation: 10,
        maxWidth: 384, // max-w-sm
        width: '100%',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 12, // p-3 rounded-t-lg
    },
    iconCircle: {
        height: 32, // h-8
        width: 32, // w-8
        marginRight: 12, // mr-3
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 9999, // rounded-full
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 4,
    },
    iconText: {
        fontSize: 20, // text-2xl
    },
    messageContainer: {
        flexGrow: 1, // flex-grow
    },
    titleText: {
        fontWeight: '700', // font-bold
        color: '#1F2937', // text-gray-800
        fontSize: 18, // text-lg
    },
    messageText: {
        fontSize: 14, // text-sm
        marginTop: 4, // mt-1
        color: '#4B5563', // text-gray-600
    },
    closeButton: {
        marginLeft: 16, // ml-4
        padding: 4, // p-1
    },
    closeButtonText: {
        color: '#9CA3AF', // text-gray-400
        fontSize: 20, // text-xl
    },
    detailsContainer: {
        padding: 12, // p-3
        fontSize: 12, // text-xs
        backgroundColor: '#F9FAFB', // bg-gray-50
        borderRadius: 16, // rounded-b-xl
        borderTopWidth: 1,
        borderColor: '#E5E7EB',
    },
    detailsText: {
        fontSize: 12,
        color: '#4B5563', // text-gray-600
        // font-mono, whitespace-pre-line ต้องจัดการด้วย prop
    }
});