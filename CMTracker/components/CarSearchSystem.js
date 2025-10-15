import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// นำเข้าสไตล์จากไฟล์ภายนอก
import { styles } from '../components/CarManagementStyles';

const API_URL = 'http://192.168.1.33:3000/api/cars';

/**
 * ฟังก์ชันเรียก API อย่างปลอดภัย พร้อมจัดการข้อผิดพลาดและโหลดข้อมูล
 * @param {string} url - URL ของ API
 * @param {object} options - ตัวเลือกสำหรับการ fetch (method, headers, body)
 * @param {string} action - ชื่อการดำเนินการสำหรับแสดงในข้อความแจ้งเตือน (เช่น 'โหลดข้อมูล', 'เพิ่มข้อมูล')
 * @param {function} onSuccess - ฟังก์ชันที่จะเรียกเมื่อ API สำเร็จ
 * @param {function} setError - ฟังก์ชันสำหรับตั้งค่าข้อผิดพลาด
 */
const safeApiCall = async (url, options, action, onSuccess, setError) => {
  try {
    const res = await fetch(url, options);
    if (!res.ok) throw new Error(`${action} ล้มเหลว`);
    // ตรวจสอบว่ามีเนื้อหา JSON หรือไม่ ก่อนพยายามแปลง
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    onSuccess(data);
  } catch (err) {
    console.error(err);
    setError(err.message);
    Alert.alert('เกิดข้อผิดพลาด', `${action} ล้มเหลว: ${err.message}`);
  }
};

export default function CarManagementScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rawCarData, setRawCarData] = useState([]);
  
  // สถานะใหม่สำหรับคำค้นหา
  const [searchTerm, setSearchTerm] = useState('');

  // สำหรับเพิ่มข้อมูลรถยนต์
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCar, setNewCar] = useState({
    brand: '',
    model: '',
    licensePlate: '',
    color: '',
    finance: '',
    financeStatus: 'ชำระเต็ม',
  });

  // สำหรับแก้ไขข้อมูลรถยนต์
  const [editingCar, setEditingCar] = useState(null);

  // โหลดข้อมูลรถทั้งหมด
  const fetchCars = async () => {
    setIsLoading(true);
    await safeApiCall(
      API_URL,
      { method: 'GET' },
      'โหลดข้อมูล',
      setRawCarData,
      setError
    );
    setIsLoading(false);
  };

  useEffect(() => {
    fetchCars();
  }, []);

  // เพิ่มข้อมูลรถ
  const handleAddCar = async () => {
    // Basic validation
    if (!newCar.brand || !newCar.model || !newCar.licensePlate) {
      Alert.alert('ข้อมูลไม่ครบถ้วน', 'กรุณากรอก ยี่ห้อ รุ่น และทะเบียนรถ');
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
        // API ควรส่งข้อมูลรถที่เพิ่มมากลับมาพร้อม ID
        setRawCarData((prev) => [...prev, data]);
        setShowAddModal(false);
        // Reset form
        setNewCar({
          brand: '',
          model: '',
          licensePlate: '',
          color: '',
          finance: '',
          financeStatus: 'ชำระเต็ม',
        });
      },
      setError
    );
    setIsLoading(false);
  };

  // แก้ไขข้อมูลรถ
  const handleUpdateCar = async () => {
    if (!editingCar || !editingCar.id) return;
    
    setIsLoading(true);
    await safeApiCall(
      `${API_URL}/${editingCar.id}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCar),
      },
      'แก้ไขข้อมูล',
      (updatedCar) => {
        setRawCarData((prev) =>
          prev.map((c) => (c.id === updatedCar.id ? updatedCar : c))
        );
        setEditingCar(null);
      },
      setError
    );
    setIsLoading(false);
  };

  // ลบข้อมูลรถ
  const handleDeleteCar = (id) => {
    Alert.alert('ยืนยันการลบ', 'คุณต้องการลบข้อมูลนี้ใช่ไหม?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ลบ',
        style: 'destructive',
        onPress: async () => {
          setIsLoading(true);
          await safeApiCall(
            `${API_URL}/${id}`,
            { method: 'DELETE' },
            'ลบข้อมูล',
            () => {
              setRawCarData((prev) => prev.filter((car) => car.id !== id));
            },
            setError
          );
          setIsLoading(false);
        },
      },
    ]);
  };

  // ----------------------------------------------------------------
  // LOGIC การค้นหา (Filtering Logic)
  // ----------------------------------------------------------------
  const filteredCars = rawCarData.filter(car => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    
    // หากไม่มีคำค้นหา ให้แสดงข้อมูลทั้งหมด
    if (!lowerCaseSearch) {
      return true;
    }

    // ตรวจสอบกับ licensePlate, model, และ finance
    const matchesLicensePlate = car.licensePlate?.toLowerCase().includes(lowerCaseSearch);
    const matchesModel = car.model?.toLowerCase().includes(lowerCaseSearch);
    const matchesFinance = car.finance?.toLowerCase().includes(lowerCaseSearch);

    return matchesLicensePlate || matchesModel || matchesFinance;
  });

  // ----------------------------------------------------------------
  // UI Component
  // ----------------------------------------------------------------
  return (
    <SafeAreaView  style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>🚗 จัดการข้อมูลรถยนต์</Text>

        {/* TextInput สำหรับการค้นหา */}
        <TextInput
          style={styles.searchInput}
          placeholder="🔍 ค้นหา: ทะเบียนรถ, รุ่นรถ, หรือ ไฟแนนซ์"
          placeholderTextColor="#6b7280"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        
        {isLoading ? (
          <ActivityIndicator size="large" color="#667eea" style={{ marginTop: 20 }}/>
        ) : filteredCars.length === 0 && searchTerm ? (
          <Text style={styles.noDataText}>ไม่พบข้อมูลรถยนต์ที่ตรงกับ "{searchTerm}"</Text>
        ) : filteredCars.length === 0 && !searchTerm ? (
          <Text style={styles.noDataText}>ยังไม่มีข้อมูลรถยนต์ในระบบ</Text>
        ) : (
          // แสดงผลข้อมูลรถยนต์ที่ผ่านการกรองแล้ว
          filteredCars.map((car, index) => (
            <View key={car.id || index} style={styles.card}>
              <Text style={styles.cardTitle}>
                {car.brand} {car.model}
              </Text>
              <Text style={styles.cardText}>ทะเบียน: {car.licensePlate}</Text>
              <Text style={styles.cardText}>สี: {car.color || '-'}</Text>
              <Text style={styles.cardText}>ไฟแนนซ์: {car.finance || '-'}</Text>
              <Text style={styles.cardText}>
                สถานะ: <Text style={car.financeStatus === 'ชำระเต็ม' ? styles.statusPaid : styles.statusPending}>
                  {car.financeStatus || 'ไม่ระบุ'}
                </Text>
              </Text>

              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.btnEdit}
                  onPress={() => setEditingCar(car)}
                >
                  <Text style={styles.btnEditText}>✏️ แก้ไข</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.btnDelete}
                  onPress={() => handleDeleteCar(car.id)}
                >
                  <Text style={styles.btnDeleteText}>🗑️ ลบ</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Floating Button */}
      <TouchableOpacity
        style={styles.fabButton}
        onPress={() => setShowAddModal(true)}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>

      {/* Modal สำหรับเพิ่มข้อมูล */}
      <Modal visible={showAddModal} animationType="slide" onRequestClose={() => setShowAddModal(false)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
            <Text style={styles.modalTitle}>เพิ่มข้อมูลรถยนต์</Text>

            {/* Input fields for adding new car */}
            {['brand', 'model', 'licensePlate', 'color', 'finance'].map(
              (field) => (
                <TextInput
                  key={field}
                  placeholder={`กรอก${
                    field === 'brand' ? 'ยี่ห้อ (เช่น Toyota)' : 
                    field === 'model' ? 'รุ่นรถ (เช่น Altis)' : 
                    field === 'licensePlate' ? 'เลขทะเบียน (จำเป็น)' : 
                    field === 'color' ? 'สีรถ' : 
                    'ชื่อไฟแนนซ์'
                  }`}
                  value={newCar[field]}
                  onChangeText={(text) => setNewCar({ ...newCar, [field]: text })}
                  style={styles.input}
                />
              )
            )}
            
            <View style={styles.statusSelectContainer}>
              <Text style={styles.statusLabel}>สถานะไฟแนนซ์:</Text>
              {['ชำระเต็ม', 'กำลังผ่อน'].map(status => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    newCar.financeStatus === status && styles.statusSelected,
                  ]}
                  onPress={() => setNewCar({ ...newCar, financeStatus: status })}
                >
                  <Text style={newCar.financeStatus === status ? styles.statusSelectedText : styles.statusOptionText}>
                    {status}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[styles.btnPrimary, { marginTop: 20 }]} 
              onPress={handleAddCar}
              disabled={isLoading}
            >
              <Text style={styles.btnPrimaryText}>{isLoading ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => setShowAddModal(false)}
              disabled={isLoading}
            >
              <Text style={styles.btnCancelText}>ยกเลิก</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Modal สำหรับแก้ไขข้อมูล */}
      <Modal visible={!!editingCar} animationType="slide" onRequestClose={() => setEditingCar(null)}>
        <SafeAreaView style={styles.modalContainer}>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
            <Text style={styles.modalTitle}>แก้ไขข้อมูลรถยนต์</Text>

            {/* Input fields for editing existing car */}
            {editingCar &&
              ['brand', 'model', 'licensePlate', 'color', 'finance'].map(
                (field) => (
                  <TextInput
                    key={field}
                    placeholder={`กรอก${field}`}
                    value={editingCar[field]}
                    onChangeText={(text) =>
                      setEditingCar({ ...editingCar, [field]: text })
                    }
                    style={styles.input}
                  />
                )
              )}
            
            {editingCar && (
              <View style={styles.statusSelectContainer}>
                <Text style={styles.statusLabel}>สถานะไฟแนนซ์:</Text>
                {['ชำระเต็ม', 'กำลังผ่อน'].map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      editingCar.financeStatus === status && styles.statusSelected,
                    ]}
                    onPress={() => setEditingCar({ ...editingCar, financeStatus: status })}
                  >
                    <Text style={editingCar.financeStatus === status ? styles.statusSelectedText : styles.statusOptionText}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <TouchableOpacity 
              style={[styles.btnPrimary, { marginTop: 20 }]} 
              onPress={handleUpdateCar}
              disabled={isLoading}
            >
              <Text style={styles.btnPrimaryText}>{isLoading ? 'กำลังบันทึก...' : 'บันทึกการแก้ไข'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => setEditingCar(null)}
              disabled={isLoading}
            >
              <Text style={styles.btnCancelText}>ยกเลิก</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
