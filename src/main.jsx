import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './redux/store';
import App from './App.jsx';
import './index.css';

const FullScreenLoader = () => (
  <div className='flex justify-center items-center h-screen'>
    <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-red-900'></div>
  </div>
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <PersistGate loading={<FullScreenLoader />} persistor={persistor}>
        <App />
      </PersistGate>
    </Provider>
  </StrictMode>
);