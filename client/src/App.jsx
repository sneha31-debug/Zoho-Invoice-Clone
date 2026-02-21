import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Invoices from './pages/Invoices/Invoices';
import CreateInvoice from './pages/Invoices/CreateInvoice';
import InvoiceDetail from './pages/Invoices/InvoiceDetail';
import Customers from './pages/Customers/Customers';
import Items from './pages/Items/Items';
import Quotes from './pages/Quotes/Quotes';
import QuoteDetail from './pages/Quotes/QuoteDetail';
import EditQuote from './pages/Quotes/EditQuote';
import Payments from './pages/Payments/Payments';
import Expenses from './pages/Expenses/Expenses';
import TimeTracking from './pages/TimeTracking/TimeTracking';
import Reports from './pages/Reports/Reports';
import Settings from './pages/Settings/Settings';
import CustomerDetail from './pages/Customers/CustomerDetail';
import CustomerStatement from './pages/Customers/CustomerStatement';
import EditInvoice from './pages/Invoices/EditInvoice';
import CreditNotes from './pages/CreditNotes/CreditNotes';
import RecurringInvoices from './pages/RecurringInvoices/RecurringInvoices';
import Users from './pages/Users/Users';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes */}
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/invoices/new" element={<CreateInvoice />} />
            <Route path="/invoices/:id" element={<InvoiceDetail />} />
            <Route path="/invoices/:id/edit" element={<EditInvoice />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/:id" element={<CustomerDetail />} />
            <Route path="/customers/:id/statement" element={<CustomerStatement />} />
            <Route path="/items" element={<Items />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/quotes/:id" element={<QuoteDetail />} />
            <Route path="/quotes/:id/edit" element={<EditQuote />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/expenses" element={<Expenses />} />
            <Route path="/time-tracking" element={<TimeTracking />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/credit-notes" element={<CreditNotes />} />
            <Route path="/recurring-invoices" element={<RecurringInvoices />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#0f172a', color: '#fff', borderRadius: '8px', fontSize: '14px' } }} />
    </AuthProvider>
  );
}

export default App;
