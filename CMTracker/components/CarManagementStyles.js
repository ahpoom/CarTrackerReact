import { StyleSheet } from "react-native";
/*CarManagementStyles.js*/
/**
 * Stylesheet for the Car Management application.
 * Includes styles for the main screen, cards, buttons, modals, and notifications.
 */

// ----------------------------------------------------------------
// 1. Main & Layout Styles
// ----------------------------------------------------------------
export const mainStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#F3F4F6", // Light gray background
        paddingTop: 40, // Space for status bar
    },
    contentWrapper: {
        flex: 1,
        paddingHorizontal: 16,
    },
    headerText: {
        fontSize: 26,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 16,
        textAlign: "center",
    },
    topSection: {
        flexDirection: "row",
        marginBottom: 16,
        alignItems: "center",
        justifyContent: "space-between",
    },
    // Search Bar Styles
    searchInputContainer: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#D1D5DB",
        marginRight: 8,
        paddingHorizontal: 8,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 14,
        paddingVertical: 0,
    },
    // Add Button Styles
    addButton: {
        backgroundColor: "#10B981", // Emerald Green
        paddingVertical: 10,
        paddingHorizontal: 12,
        borderRadius: 8,
        height: 40,
        justifyContent: "center",
    },
    addButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 14,
    },
    disabledButton: {
        opacity: 0.6,
    },

    // List & State Styles
    listSection: {
        flex: 1,
    },
    carListScroll: {
        // Style for ScrollView itself
    },
    carList: {
        paddingBottom: 16, // Space at the bottom of the list
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 30,
    },
    loadingText: {
        marginTop: 10,
        fontSize: 16,
        color: "#4F46E5",
    },
    emptyStateContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        paddingVertical: 50,
    },
    emptyStateEmoji: {
        fontSize: 50,
        marginBottom: 10,
    },
    emptyStateText: {
        fontSize: 16,
        color: "#6B7280",
        textAlign: "center",
    },
});

// ----------------------------------------------------------------
// 2. Car Card Styles (Style จาก CarCard Component เดิม)
// ----------------------------------------------------------------
export const carCardStyles = StyleSheet.create({
    cardContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        borderLeftWidth: 5,
        borderLeftColor: "#4F46E5", // Indigo accent
    },
    infoSection: {
        flex: 2,
    },
    titleText: {
        fontSize: 18,
        fontWeight: "bold",
        marginBottom: 8,
        color: "#1F2937",
    },
    detailsContainer: {
        // No specific style needed, used for grouping
    },
    detailLine: {
        fontSize: 14,
        color: "#4B5563",
        marginBottom: 2,
    },
    detailLabel: {
        fontWeight: "600",
        color: "#1F2937",
    },
    // Status Badge
    financeStatusBadge: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
        fontWeight: "bold",
        fontSize: 13,
        overflow: "hidden", // Required for borderRadius on Text in Android
    },
    statusFull: {
        backgroundColor: "#D1FAE5", // Light green
        color: "#065F46", // Dark green text
    },
    statusInstallment: {
        backgroundColor: "#FEF3C7", // Light yellow
        color: "#92400E", // Dark yellow text
    },

    // Button Section
    buttonContainer: {
        flex: 1,
        flexDirection: "row",
        marginLeft: 10,
        justifyContent: "flex-end",
    },
    buttonBase: {
        paddingVertical: 8,
        paddingHorizontal: 10,
        borderRadius: 6,
        marginLeft: 8,
        minWidth: 70,
        justifyContent: "center",
        alignItems: "center",
    },
    editButton: {
        backgroundColor: "#3B82F6", // Blue for Edit
    },
    deleteButton: {
        backgroundColor: "#EF4444", // Red for Delete
    },
    buttonText: {
        color: "#FFFFFF",
        fontSize: 12,
        fontWeight: "bold",
    },
    disabledButton: {
        opacity: 0.6,
    },
});

// ----------------------------------------------------------------
// 3. Modal Styles (Style จาก ModalComponent เดิม)
// ----------------------------------------------------------------
export const modalStyles = StyleSheet.create({
    overlay: {
        flex: 1, 
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        
        // 🚨 แก้ไขให้ Modal อยู่ติดขอบล่างของพื้นที่ที่เหลือ
        justifyContent: 'center-end', // ต้องใช้ 'flex-end' เพื่อให้ KeyboardAvoidingView ทำงานได้ดี
        alignItems: "center",       
    },
    modalContent: {
        width: "90%",
        maxWidth: 500,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
        // maxHeight: "80%", // Limit height on large screens
        // 🚨 ถูกต้องแล้ว: flex: 1 เพื่อให้เนื้อหาภายใน Modal จัดเรียงได้อย่างถูกต้อง
        flex: 1, 
    },
    // 💥 Style สำหรับ Title ใน Modal
    modalTitle: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#1F2937",
        marginBottom: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#E5E7EB",
        paddingBottom: 10,
    },
    // 💥 Style สำหรับ ScrollView Content
    scrollViewContent: {
        // ให้พื้นที่ด้านใน ScrollView มีการ Padding ด้านล่าง
        paddingBottom: 10,
    },

    // Form Styles
    formField: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: "600",
        color: "#374151",
        marginBottom: 5,
    },
    // 💥 Style สำหรับการแสดงเครื่องหมาย * ที่ช่อง Required
    requiredText: {
        color: "#EF4444", // Red 500
        fontWeight: "bold",
    },
    textInput: {
        borderWidth: 1,
        borderColor: "#D1D5DB",
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 16,
        backgroundColor: "#F9FAFB",
        color: "#1F2937",
    },
    // 💥 Style สำหรับ TextInput ที่มี Error
    errorTextInput: {
        borderColor: "#EF4444", // Red 500
        borderWidth: 2,
        backgroundColor: "#FEF2F2", // Light Red background
    },
    // 💥 Style สำหรับข้อความ Error
    errorText: {
        fontSize: 12,
        color: "#EF4444", // Red 500
        marginTop: 4,
    },

    // 💥 Status Select Styles (สำหรับ financeStatus)
    selectContainer: {
        flexDirection: "row",
        borderRadius: 8,
        overflow: "hidden",
        backgroundColor: "#F3F4F6",
        borderWidth: 1,
        borderColor: "#D1D5DB",
    },
    selectOptionBase: {
        flex: 1,
        paddingVertical: 10,
        alignItems: "center",
    },
    selectOptionUnselected: {
        backgroundColor: "#FFFFFF",
    },
    selectOptionSelected: {
        backgroundColor: "#4F46E5", // Indigo 600
    },
    selectOptionText: {
        color: "#1F2937",
        fontWeight: "normal",
        fontSize: 14,
    },
    selectOptionTextSelected: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },

    // Footer & Buttons
    buttonGroup: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 20,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: "#E5E7EB",
    },
    saveButton: {
        flex: 1,
        backgroundColor: "#4F46E5", // Indigo
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    saveButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#E5E7EB", // Light Gray
        padding: 12,
        borderRadius: 8,
        marginLeft: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#1F2937",
        fontWeight: "bold",
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.6,
    },
    loadingContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
});

// ----------------------------------------------------------------
// 4. Confirmation Modal Styles (Style จาก ConfirmModal เดิม)
// ----------------------------------------------------------------
export const confirmModalStyles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        maxWidth: 400,
        backgroundColor: "#FFFFFF",
        borderRadius: 12,
        padding: 20,
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 5,
    },
    headerText: {
        fontSize: 20,
        fontWeight: "bold",
        color: "#EF4444", // Red for warning
        marginBottom: 10,
        textAlign: "center",
    },
    messageText: {
        fontSize: 15,
        color: "#4B5563",
        marginBottom: 20,
        textAlign: "center",
    },
    footer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    cancelButton: {
        flex: 1,
        backgroundColor: "#E5E7EB",
        padding: 12,
        borderRadius: 8,
        marginRight: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    cancelButtonText: {
        color: "#1F2937",
        fontWeight: "bold",
        fontSize: 16,
    },
    confirmButton: {
        flex: 1,
        backgroundColor: "#EF4444", // Red for delete action
        padding: 12,
        borderRadius: 8,
        marginLeft: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    confirmButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
        fontSize: 16,
    },
    disabledButton: {
        opacity: 0.6,
    },
});

// ----------------------------------------------------------------
// 5. Notification Toast Styles (Style จาก NotificationToast Component เดิม)
// ----------------------------------------------------------------
export const notificationStyles = StyleSheet.create({
    // Container for absolute positioning
    toastContainerAbsolute: {
        position: "absolute",
        top: 50, // 50px จากด้านบน (ปรับได้ตามต้องการ)
        left: 20,
        right: 20,
        zIndex: 1000,
        borderRadius: 12,
        overflow: "hidden",
        elevation: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
    },
    // Main content container
    toastContainer: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#FFFFFF", // จะถูก override ด้วย bgColorStyle
    },
    header: {
        flexDirection: "row",
        alignItems: "flex-start",
    },
    iconCircle: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: "rgba(255, 255, 255, 0.3)",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 10,
    },
    iconText: {
        fontSize: 18,
    },
    messageContainer: {
        flex: 1,
    },
    titleText: {
        fontSize: 16,
        fontWeight: "bold",
        color: "#FFFFFF", // สีหลักสำหรับ Toast Header
    },
    messageText: {
        fontSize: 14,
        color: "rgba(255, 255, 255, 0.8)",
        marginTop: 2,
    },
    closeButton: {
        marginLeft: 10,
        padding: 5,
        marginTop: -5,
        marginRight: -5,
    },
    closeButtonText: {
        fontSize: 16,
        color: "#FFFFFF",
        opacity: 0.7,
    },
    detailsContainer: {
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: "rgba(255, 255, 255, 0.3)",
    },
    detailsText: {
        fontSize: 12,
        color: "rgba(255, 255, 255, 0.8)",
    },
    
    // ❌ ลบ Style นี้ออก เพราะเป็น Style ที่ใช้ในการแก้ปัญหา KeyboardAvoidingView 
    // และควรถูกกำหนดใน Component โดยตรง 
    /*
    keyboardAvoiding: {
        flex: 1,
        width: "100%",
        alignItems: "center", 
        justifyContent: "center", 
    },
    */
});