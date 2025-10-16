import React, { useState, useEffect, useCallback } from "react";
// 💥 แก้ไข: ต้อง Import TextInput และ ScrollView
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  TextInput,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Dimensions
} from "react-native";
import {
  mainStyles,
  carCardStyles,
  modalStyles,
  confirmModalStyles,
  notificationStyles,
} from "./CarManagementStyles";
// API URL (จำลอง) - *กรุณาเปลี่ยนเป็น URL จริงที่ใช้งานได้*
const API_URL = "http://192.168.1.33:3000/api/cars";

// ----------------------------------------------------------------
// Component: Notification Toast (ใช้โค้ดเดิม)
// ----------------------------------------------------------------

const getIconMapping = (type) => {
  switch (type) {
    case "success":
      return {
        iconEmoji: "✅",
        bgColorStyle: { backgroundColor: "#10B981" },
        title: "สำเร็จ!",
        textColor: "#065F46",
      };
    case "error":
      return {
        iconEmoji: "❌",
        bgColorStyle: { backgroundColor: "#EF4444" },
        title: "ข้อผิดพลาด!",
        textColor: "#991B1B",
      };
    case "warning":
      return {
        iconEmoji: "⚠️",
        bgColorStyle: { backgroundColor: "#F59E0B" },
        title: "คำเตือน!",
        textColor: "#92400E",
      };
    default:
      return {
        iconEmoji: "ℹ️",
        bgColorStyle: { backgroundColor: "#3B82F6" },
        title: "ข้อมูล",
        textColor: "#1E40AF",
      };
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
    // 💥 ใช้ absolute position เพื่อให้ Toast ลอยอยู่บนสุด
    <View
      style={[
        notificationStyles.toastContainerAbsolute,
        { borderColor: "#E5E7EB" },
      ]}
    >
      {/* Header / Main message section */}
      <View style={[notificationStyles.toastContainer, bgColorStyle]}>
        <View style={notificationStyles.header}>
          {/* Icon Circle - ใช้ View */}
          <View style={notificationStyles.iconCircle}>
            <Text style={notificationStyles.iconText}>{iconEmoji}</Text>
          </View>

          <View style={notificationStyles.messageContainer}>
            <Text style={notificationStyles.titleText}>
              {notification.title || title}
            </Text>
            <Text style={notificationStyles.messageText}>
              {notification.message}
            </Text>
          </View>

          {/* Button สำหรับปิด */}
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
    </View>
  );
};

// ----------------------------------------------------------------
// Function: safeApiCall (Standardized fetch with Exponential Backoff)
// (ใช้โค้ดเดิม)
// ----------------------------------------------------------------

const safeApiCall = async (
  url,
  options,
  action,
  onSuccess,
  setNotification
) => {
  let data = {};
  const MAX_RETRIES = 3;
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      const res = await fetch(url, options);
      const status = res.status;

      if (!res.ok) {
        const errorText = await res.text();

        console.error(
          `[API ERROR] Status ${status} for ${action} ${url}:`,
          errorText.substring(0, 500)
        );

        const detailedError =
          errorText.substring(0, 100).trim() ||
          "เซิร์ฟเวอร์ไม่ได้ระบุข้อผิดพลาด";
        throw new Error(
          `${action} ล้มเหลว (Status: ${status}). รายละเอียด: ${detailedError}`
        );
      }

      const contentType = res.headers.get("content-type");
      const isJson =
        contentType && contentType.indexOf("application/json") !== -1;

      if (isJson && status !== 204) {
        // 204 No Content shouldn't try to parse JSON
        data = await res.json();
      } else {
        data = {};
      }

      onSuccess(data);
      return; // Success, break the loop
    } catch (err) {
      console.error("API Call Catch Error:", err);

      if (retries === MAX_RETRIES - 1) {
        const errorMessage =
          err.message || `เกิดข้อผิดพลาดเครือข่ายที่ไม่ทราบสาเหตุ`;

        setNotification({
          type: "error",
          title: "เชื่อมต่อล้มเหลว",
          message: `ไม่สามารถดำเนินการ ${action} ได้ โปรดลองใหม่อีกครั้ง`,
          details: errorMessage,
        });
      } else {
        // Exponential backoff
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retries) * 1000)
        );
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
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCar, setEditingCar] = useState(null);
  const [notification, setNotification] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [carToDeleteId, setCarToDeleteId] = useState(null);

  const initialCarState = {
    brand: "",
    model: "",
    licensePlate: "",
    color: "",
    finance: "",
    financeStatus: "ชำระเต็ม", // Default value
  };

  const [newCar, setNewCar] = useState(initialCarState);

  // โหลดข้อมูลรถทั้งหมด (ใช้โค้ดเดิม)
  const fetchCars = useCallback(async () => {
    setIsLoading(true);
    await safeApiCall(
      API_URL,
      { method: "GET" },
      "โหลดข้อมูล",
      (data) => {
        const carArray = Array.isArray(data)
          ? data
          : data && Array.isArray(data.cars)
          ? data.cars
          : [];
        setRawCarData(
          carArray.map((car) => ({
            ...car,
            // Normalize ID to 'id' for consistent React state management
            id: car.id || car._id,
          }))
        );
      },
      setNotification
    );
    setIsLoading(false);
  }, [setNotification]);

  useEffect(() => {
    // ให้โหลดข้อมูลเมื่อ Component ถูกโหลดครั้งแรก
    fetchCars();
  }, [fetchCars]);

  // เพิ่มข้อมูลรถ (ใช้โค้ดเดิม)
  const handleAddCar = async () => {
    if (!newCar.brand || !newCar.model || !newCar.licensePlate) {
      setNotification({
        type: "warning",
        message: "กรุณากรอก ยี่ห้อ รุ่น และทะเบียนรถ",
      });
      return;
    }

    setIsLoading(true);

    await safeApiCall(
      API_URL,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCar),
      },
      "เพิ่มข้อมูล",
      (data) => {
        const addedCarId = data.id || data._id || Date.now().toString(); // Fallback ID if API doesn't return one

        if (data && addedCarId) {
          const carWithId = { ...newCar, id: addedCarId };
          setRawCarData((prev) => [...prev, carWithId]);
          setShowAddModal(false);
          setNewCar(initialCarState);
          setNotification({
            type: "success",
            message: "เพิ่มข้อมูลรถยนต์เรียบร้อยแล้ว",
          });
        } else {
          setNotification({
            type: "warning",
            message: "เพิ่มข้อมูลสำเร็จ",
            details:
              "ข้อมูลถูกบันทึกแล้ว (ID ไม่ถูกส่งกลับมา) กำลังโหลดรายการล่าสุด...",
          });
          fetchCars();
        }
      },
      setNotification
    );
    setIsLoading(false);
  };

  // แก้ไขข้อมูลรถ (ใช้โค้ดเดิม)
  const handleUpdateCar = async () => {
    if (!editingCar || !editingCar.id) return;

    if (!editingCar.brand || !editingCar.model || !editingCar.licensePlate) {
      setNotification({
        type: "warning",
        message: "ข้อมูลไม่ครบถ้วน",
        details: "กรุณากรอก ยี่ห้อ รุ่น และทะเบียนรถ",
      });
      return;
    }

    setIsLoading(true);
    const updateUrl = `${API_URL}/${editingCar.id}`;

    await safeApiCall(
      updateUrl,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingCar),
      },
      "แก้ไขข้อมูล",
      (updatedCarResponse) => {
        const finalUpdatedCar = { ...editingCar, ...updatedCarResponse };

        setRawCarData((prev) =>
          prev.map((c) => (c.id === finalUpdatedCar.id ? finalUpdatedCar : c))
        );
        setEditingCar(null);

        setNotification({
          type: "success",
          title: "แก้ไขสำเร็จ!",
          message: `ข้อมูลรถยนต์ ${finalUpdatedCar.licensePlate} ถูกบันทึกเรียบร้อยแล้ว`,
          details:
            `ยี่ห้อ: ${finalUpdatedCar.brand}\n` +
            `รุ่น: ${finalUpdatedCar.model}\n` +
            `ทะเบียน: ${finalUpdatedCar.licensePlate}\n` +
            `สถานะไฟแนนซ์: ${finalUpdatedCar.financeStatus || "ไม่ระบุ"}`,
        });
      },
      setNotification
    );
    setIsLoading(false);
  };

  // ลบข้อมูลรถ (ใช้โค้ดเดิม)
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
      { method: "DELETE" },
      "ลบข้อมูล",
      () => {
        setRawCarData((prev) => prev.filter((car) => car.id !== id));
        setNotification({
          type: "success",
          message: `ลบข้อมูลรถยนต์ทะเบียน ${
            rawCarData.find((c) => c.id === id)?.licensePlate || "ที่เลือก"
          } เรียบร้อยแล้ว`,
        });
      },
      setNotification
    );
    setCarToDeleteId(null);
    setIsLoading(false);
  };

  // LOGIC การค้นหา (Filtering Logic) (ใช้โค้ดเดิม)
  const filteredCars = rawCarData.filter((car) => {
    const lowerCaseSearch = searchTerm.toLowerCase();
    if (!lowerCaseSearch) {
      return true;
    }

    const matchesLicensePlate = car.licensePlate
      ?.toLowerCase()
      .includes(lowerCaseSearch);
    const matchesModel = car.model?.toLowerCase().includes(lowerCaseSearch);
    const matchesFinance = car.finance?.toLowerCase().includes(lowerCaseSearch);
    const matchesBrand = car.brand?.toLowerCase().includes(lowerCaseSearch);

    return (
      matchesLicensePlate || matchesModel || matchesFinance || matchesBrand
    );
  });

  // ----------------------------------------------------------------
  // UI Components (Inline) - แปลงเป็น View/Text/Pressable
  // ----------------------------------------------------------------
  const CarCard = ({ car }) => (
    <View style={carCardStyles.cardContainer}>
      <View style={carCardStyles.infoSection}>
        <Text style={carCardStyles.titleText}>
          {car.brand} {car.model}
        </Text>
        <View style={carCardStyles.detailsContainer}>
          <Text style={carCardStyles.detailLine}>
            <Text style={carCardStyles.detailLabel}>ทะเบียน:</Text>{" "}
            {car.licensePlate}
          </Text>
          <Text style={carCardStyles.detailLine}>
            <Text style={carCardStyles.detailLabel}>สี:</Text>{" "}
            {car.color || "-"}
          </Text>
          <Text style={carCardStyles.detailLine}>
            <Text style={carCardStyles.detailLabel}>ไฟแนนซ์:</Text>{" "}
            {car.finance || "-"}
          </Text>
          <Text style={carCardStyles.detailLine}>
            <Text style={carCardStyles.detailLabel}>สถานะ: </Text>
            <Text
              style={[
                carCardStyles.financeStatusBadge,
                car.financeStatus === "ชำระเต็ม"
                  ? carCardStyles.statusFull
                  : carCardStyles.statusInstallment,
              ]}
            >
              {car.financeStatus || "ไม่ระบุ"}
            </Text>
          </Text>
        </View>
      </View>

      <View style={carCardStyles.buttonContainer}>
        <Pressable
          style={[
            carCardStyles.buttonBase,
            carCardStyles.editButton,
            isLoading && carCardStyles.disabledButton,
          ]}
          onPress={() => setEditingCar(car)}
          disabled={isLoading}
          accessibilityLabel="แก้ไขข้อมูลรถ"
        >
          <Text style={carCardStyles.buttonText}>📝 แก้ไข</Text>
        </Pressable>
        <Pressable
          style={[
            carCardStyles.buttonBase,
            carCardStyles.deleteButton,
            isLoading && carCardStyles.disabledButton,
          ]}
          onPress={() => confirmDelete(car.id)}
          disabled={isLoading}
          accessibilityLabel="ลบข้อมูลรถ"
        >
          <Text style={carCardStyles.buttonText}>🗑️ ลบ</Text>
        </Pressable>
      </View>
    </View>
  );

    const screenHeight = Dimensions.get('window').height;
    const MODAL_MAX_HEIGHT = screenHeight * 0.85; // ลองใช้ 85% แทน 80% เพื่อความยืดหยุ่น
  // ************************************************************
  // ModalComponent - ใช้ RN Modal จริงๆ เพื่อแสดงผลแบบ Overlay
  // ************************************************************
  const ModalComponent = ({
    title,
    carState,
    setCarState,
    onSave,
    onClose,
    setNotification,
    isLoading = false,
  }) => {
    const [formData, setFormData] = useState(carState || {});
    const [validationErrors, setValidationErrors] = useState({});
    const isEdit = !!carState?.id;

    const requiredFields = ["brand", "model", "licensePlate"];

    const fieldMapping = {
      brand: "ยี่ห้อรถ",
      model: "รุ่นรถ",
      licensePlate: "ทะเบียน",
      color: "สี",
      finance: "ไฟแนนซ์",
      financeStatus: "สถานะทางการเงิน",
    };

    const validateForm = () => {
      let errors = {};
      let isValid = true;
      requiredFields.forEach((key) => {
        if (!formData[key] || String(formData[key]).trim() === "") {
          errors[key] = `${fieldMapping[key] || key} ไม่สามารถเว้นว่างได้`;
          isValid = false;
        }
      });
      setValidationErrors(errors);
      return isValid;
    };

    const handleSave = () => {
      if (validateForm()) {
        setCarState(formData);
        onSave();
        setValidationErrors({});
      } else {
        if (setNotification) {
          setNotification({
            type: "warning",
            title: "ข้อมูลไม่สมบูรณ์",
            message: "กรุณากรอกข้อมูลในช่องที่จำเป็นให้ครบถ้วน",
          });
        }
      }
    };

    const financeStatusOptions = ["ชำระเต็ม", "ผ่อนชำระ"];

    return (
      <Modal transparent visible onRequestClose={onClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
          // 🚨 ลบ keyboardVerticalOffset ออก ถ้าเคยมี
        >
          {/* View ที่ใช้ modalStyles.overlay ต้องอยู่ข้างใน KeyboardAvoidingView */}
          <View style={modalStyles.overlay}>
            {/* 🚨 แก้ไข: กำหนด maxHeight ด้วยตัวเลขที่คำนวณจาก Dimensions */}
            <View style={[
                modalStyles.modalContent,
                { maxHeight: MODAL_MAX_HEIGHT } // บังคับความสูงสูงสุดด้วยตัวเลข (Absolute value)
            ]}>
              <Text style={modalStyles.modalTitle}>{title}</Text>

              {/* ScrollView มี flex: 1 เพื่อให้เนื้อหาฟอร์มเลื่อนได้และดันปุ่มลงด้านล่าง */}
              <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={modalStyles.scrollViewContent}
              >
                {/* ... (Form fields map - NO CHANGES) ... */}
                {Object.keys(fieldMapping).map((key) => {
                  const label = fieldMapping[key];
                  const isRequired = requiredFields.includes(key);
                  const error = validationErrors[key];

                  if (key === "financeStatus") {
                    return (
                      <View key={key} style={modalStyles.formField}>
                        <Text style={modalStyles.label}>
                          {label}{" "}
                          {isRequired ? (
                            <Text style={modalStyles.requiredText}>*</Text>
                          ) : (
                            ""
                          )}
                        </Text>
                        <View style={modalStyles.selectContainer}>
                          {financeStatusOptions.map((option) => (
                            <Pressable
                              key={option}
                              onPress={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  [key]: option,
                                }))
                              }
                              style={[
                                modalStyles.selectOptionBase,
                                formData[key] === option
                                  ? modalStyles.selectOptionSelected
                                  : modalStyles.selectOptionUnselected,
                              ]}
                            >
                              <Text
                                style={[
                                  modalStyles.selectOptionText,
                                  formData[key] === option
                                    ? modalStyles.selectOptionTextSelected
                                    : {},
                                ]}
                              >
                                {option}
                              </Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>
                    );
                  }

                  return (
                    <View key={key} style={modalStyles.formField}>
                      <Text style={modalStyles.label}>
                        {label}{" "}
                        {isRequired ? (
                          <Text style={modalStyles.requiredText}>*</Text>
                        ) : (
                          ""
                        )}
                      </Text>
                      <TextInput
                        style={[
                          modalStyles.textInput,
                          error && modalStyles.errorTextInput,
                        ]}
                        value={formData[key] || ""}
                        onChangeText={(text) => {
                          setFormData((prev) => ({ ...prev, [key]: text }));
                          if (error) {
                            setValidationErrors((prev) => {
                              const newErrors = { ...prev };
                              delete newErrors[key];
                              return newErrors;
                            });
                          }
                        }}
                        placeholder={`กรอก ${label}`}
                        autoCapitalize={
                          key === "brand" || key === "model" ? "words" : "none"
                        }
                        keyboardType={
                          key === "licensePlate" ? "default" : "default"
                        }
                      />
                      {error && (
                        <Text style={modalStyles.errorText}>{error}</Text>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              {/* ปุ่มบันทึกและยกเลิก */}
              <View style={modalStyles.buttonGroup}>
                <Pressable
                  style={[
                    modalStyles.saveButton,
                    isLoading && modalStyles.disabledButton,
                  ]}
                  onPress={handleSave}
                  disabled={isLoading}
                >
                  <Text style={modalStyles.saveButtonText}>
                    {isEdit ? "บันทึกการแก้ไข" : "บันทึกข้อมูล"}
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    modalStyles.cancelButton,
                    isLoading && modalStyles.disabledButton,
                  ]}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text style={modalStyles.cancelButtonText}>ยกเลิก</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    );
  };

  // ************************************************************
  // ConfirmModal - ใช้ RN Modal จริงๆ
  // ************************************************************
  const ConfirmModal = ({ show, onConfirm, onCancel, message }) => {
    return (
      // 💥 ต้องใช้ Modal component ของ React Native
      <Modal
        animationType="fade"
        transparent={true}
        visible={show}
        onRequestClose={onCancel}
      >
        <View style={confirmModalStyles.overlay}>
          <View style={confirmModalStyles.modalContent}>
            <Text style={confirmModalStyles.headerText}>
              <Text>⚠️ </Text>
              <Text>ยืนยันการลบ</Text>
            </Text>
            <Text style={confirmModalStyles.messageText}>{message}</Text>
            <View style={confirmModalStyles.footer}>
              <Pressable
                style={[
                  confirmModalStyles.cancelButton,
                  isLoading && confirmModalStyles.disabledButton,
                ]}
                onPress={onCancel}
                disabled={isLoading}
              >
                <Text style={confirmModalStyles.cancelButtonText}>ยกเลิก</Text>
              </Pressable>
              <Pressable
                style={[
                  confirmModalStyles.confirmButton,
                  isLoading && confirmModalStyles.disabledButton,
                ]}
                onPress={onConfirm}
                disabled={isLoading}
              >
                <Text style={confirmModalStyles.confirmButtonText}>
                  {isLoading ? "กำลังลบ..." : "ลบถาวร"}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  // ----------------------------------------------------------------
  // Main Render
  // ----------------------------------------------------------------
  return (
    <View style={mainStyles.container}>
      <View style={mainStyles.contentWrapper}>
        <Text style={mainStyles.headerText}>
          <Text>🚗 </Text>
          <Text>จัดการข้อมูลรถยนต์</Text>
        </Text>

        {/* Search Input and Add Button */}
        <View style={mainStyles.topSection}>
          <View style={mainStyles.searchInputContainer}>
            <View style={mainStyles.searchIcon}>
              <Text style={{ fontSize: 18 }}>🔍</Text>
            </View>
            {/* 💥 แก้ไข: เปลี่ยน Text เป็น TextInput */}
            <TextInput
              style={mainStyles.searchInput}
              placeholder="ค้นหา: ทะเบียนรถ, รุ่นรถ, ยี่ห้อ หรือ ไฟแนนซ์"
              value={searchTerm}
              onChangeText={(text) => setSearchTerm(text)}
              autoCapitalize="none"
            />
          </View>
          <Pressable
            style={[
              mainStyles.addButton,
              isLoading && mainStyles.disabledButton,
            ]}
            onPress={() => {
              setNewCar(initialCarState);
              setShowAddModal(true);
            }}
            disabled={isLoading}
          >
            <Text style={mainStyles.addButtonText}>+ เพิ่มรถยนต์ใหม่</Text>
          </Pressable>
        </View>

        {/* Car List / Loading / Empty State */}
        <View style={mainStyles.listSection}>
          {isLoading && rawCarData.length === 0 ? (
            <View style={mainStyles.loadingContainer}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={mainStyles.loadingText}>กำลังโหลดข้อมูล...</Text>
            </View>
          ) : filteredCars.length === 0 ? (
            <View style={mainStyles.emptyStateContainer}>
              <Text style={mainStyles.emptyStateEmoji}>🤷‍♂️</Text>
              <Text style={mainStyles.emptyStateText}>
                {searchTerm
                  ? `ไม่พบข้อมูลรถยนต์ที่ตรงกับ "${searchTerm}"`
                  : "ยังไม่มีข้อมูลรถยนต์ในระบบ"}
              </Text>
            </View>
          ) : (
            // 💥 แก้ไข: ห่อรายการรถยนต์ด้วย ScrollView เพื่อให้เลื่อนได้
            <ScrollView style={mainStyles.carListScroll}>
              <View style={mainStyles.carList}>
                {filteredCars.map((car, index) => (
                  <CarCard key={car.id || index} car={car} />
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </View>

      {/* Modals - ถูกย้ายไปใช้ RN Modal Component จริงๆ ด้านบนแล้ว */}

      {/* Add Modal */}
      {showAddModal && !editingCar && (
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
        message={`คุณต้องการลบข้อมูลรถยนต์ทะเบียน ${
          rawCarData.find((c) => c.id === carToDeleteId)?.licensePlate ||
          "ที่เลือก"
        } ใช่ไหม? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={handleDeleteCar}
        onCancel={() => {
          setShowConfirmModal(false);
          setCarToDeleteId(null);
        }}
      />

      {/* Notification Toast */}
      <NotificationToast
        notification={notification}
        setNotification={setNotification}
      />
    </View>
  );
}
