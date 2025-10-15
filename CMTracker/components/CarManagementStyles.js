import { StyleSheet } from 'react-native';

/**
 * Stylesheet for the Car Management application screens.
 * Includes styles for layout, cards, buttons, Floating Action Button (FAB), and modals.
 */
export const styles = StyleSheet.create({
  // --- Layout/Container Styles ---
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9ff' // Light background color for the screen
  },
  scrollView: { 
    padding: 15 
  },
  
  // --- Header/Title Styles ---
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  
  // --- Card Styles (For displaying car details) ---
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 10,
    elevation: 3, // Android shadow
    shadowColor: '#000', // iOS shadow
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  cardTitle: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    marginBottom: 5 
  },
  cardText: { 
    fontSize: 15, 
    color: '#555' 
  },
  
  // --- Action Button Styles (Inside Card) ---
  buttonRow: { 
    flexDirection: 'row', 
    marginTop: 10, 
    justifyContent: 'space-between' 
  },
  btnEdit: {
    backgroundColor: '#5a67d8', // Indigo/Blue for Edit
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginRight: 5,
  },
  btnEditText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  btnDelete: {
    backgroundColor: '#e53e3e', // Red for Delete
    padding: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 5,
  },
  btnDeleteText: { 
    color: '#fff', 
    textAlign: 'center', 
    fontWeight: '600' 
  },
  
  // --- Floating Action Button (FAB) Styles ---
  fabButton: {
    position: 'absolute',
    bottom: 25,
    right: 25,
    backgroundColor: '#667eea', // Primary color for FAB
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  fabText: { 
    fontSize: 30, 
    color: '#fff', 
    fontWeight: 'bold', 
    marginTop: -3 // Minor adjustment for 'plus' symbol alignment
  },
  
  // --- Modal Styles (For Add/Edit forms) ---
  modalContainer: { 
    flex: 1, 
    padding: 20,
    backgroundColor: '#f8f9ff',
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    marginBottom: 15 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  
  // --- Form Button Styles ---
  btnPrimary: {
    backgroundColor: '#667eea', // Primary action button
    padding: 15,
    borderRadius: 10,
    marginTop: 15,
  },
  btnPrimaryText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    textAlign: 'center',
    fontSize: 16,
  },
  btnCancel: {
    backgroundColor: '#ccc', // Secondary/Cancel button
    padding: 15,
    borderRadius: 10,
    marginTop: 10,
  },
  btnCancelText: { 
    textAlign: 'center',
    fontWeight: '600',
    color: '#333'
  },
});
