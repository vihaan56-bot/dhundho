import React from 'react';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { MapHome } from './components/MapHome';
import { AddThing } from './components/AddThing';
import { AskDhundho } from './components/AskDhundho';
import { MyThings } from './components/MyThings';
import { VisualLocation } from './components/VisualLocation';
import { Login } from './components/Login';

const AppContent: React.FC = () => {
  const { currentView, setView, isAuthenticated } = useInventory();

  // Retrieve editing ID from localStorage if set
  const editingThingId = localStorage.getItem('dhundho_editing_thing_id');

  const handleAddSuccess = () => {
    localStorage.removeItem('dhundho_editing_thing_id');
    setView('things');
  };

  if (!isAuthenticated) {
    return <Login />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'map':
        return <MapHome />;
      case 'add':
        // Wrap with handler to clear local storage edit token upon success
        return (
          <AddThing 
            editingThingId={editingThingId} 
            onSuccess={handleAddSuccess} 
          />
        );
      case 'ask':
        return <AskDhundho />;
      case 'things':
        return <MyThings />;
      case 'ar':
        return <VisualLocation />;
      default:
        return <Dashboard />;
    }
  };

  return <Layout>{renderView()}</Layout>;
};

function App() {
  return (
    <InventoryProvider>
      <AppContent />
    </InventoryProvider>
  );
}

export default App;
