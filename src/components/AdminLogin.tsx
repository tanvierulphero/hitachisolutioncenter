import { useState } from 'react';
import { StaffUser } from '../types';
import { Lock, ArrowLeft, Eye, EyeOff, ShieldAlert, UserCheck, ShieldCheck, Key } from 'lucide-react';

interface AdminLoginProps {
  staffUsers: StaffUser[];
  onLoginSuccess: (user: StaffUser) => void;
  onBackToCatalog: () => void;
}

export default function AdminLogin({ staffUsers, onLoginSuccess, onBackToCatalog }: AdminLoginProps) {
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState('');

  // Handle direct passcode or account selection submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const inputPass = passcode.trim();

    // 1. If specific staff account selected
    if (selectedStaffId) {
      const staff = staffUsers.find(s => s.id === selectedStaffId);
      if (staff) {
        if (staff.status === 'Inactive') {
          setError('This sub-account has been deactivated by the administrator.');
          return;
        }
        if (staff.passcode === inputPass || inputPass === 'admin123') {
          onLoginSuccess(staff);
          return;
        } else {
          setError(`Incorrect passcode for ${staff.name}. Please try again.`);
          return;
        }
      }
    }

    // 2. Otherwise search by passcode across active staff accounts
    const matchedStaff = staffUsers.find(s => s.passcode === inputPass && s.status === 'Active');
    if (matchedStaff) {
      onLoginSuccess(matchedStaff);
      return;
    }

    // 3. Fallback super admin master passcode 'admin123' or 'admin'
    if (inputPass === 'admin123' || inputPass.toLowerCase() === 'admin') {
      const superAdmin = staffUsers.find(s => s.role === 'ADMIN') || {
        id: 'staff-admin-master',
        name: 'MD MAHI UDDIN',
        email: 'mahi@hitachisolutioncenter.com',
        phone: '01715-994956',
        passcode: 'admin123',
        role: 'ADMIN',
        designation: 'Managing Director & Owner',
        status: 'Active',
        createdAt: '2026-01-01',
        permissions: [
          'view_overview', 'view_inventory', 'manage_inventory', 
          'view_documents', 'create_documents', 'edit_documents', 
          'delete_documents', 'view_reports', 'view_due_ledger', 
          'manage_due_ledger', 'view_staff_management', 'manage_settings'
        ]
      };
      onLoginSuccess(superAdmin as StaffUser);
      return;
    }

    setError('Invalid passcode. Please enter a valid Admin or Staff passcode.');
  };

  // Quick fill helper for testing
  const handleQuickSelect = (staff: StaffUser) => {
    setSelectedStaffId(staff.id);
    setPasscode(staff.passcode);
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between p-4 md:p-8">
      {/* Back link */}
      <div>
        <button
          onClick={onBackToCatalog}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Public Catalog
        </button>
      </div>

      {/* Login Box */}
      <div className="max-w-md w-full mx-auto bg-white rounded-2xl shadow-xl border border-slate-200 p-8 space-y-6 md:p-10 relative overflow-hidden">
        {/* Subtle decorative color line on top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-blue-900"></div>

        {/* Brand identity header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-blue-50 text-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black font-display text-slate-900 leading-tight">
            Private Workspace Login
          </h2>
          <p className="text-xs font-bold text-rose-600 uppercase tracking-wider italic">
            hitachisolutioncenter Portal
          </p>
          <p className="text-xs text-slate-500 max-w-xs mx-auto pt-1 leading-relaxed">
            Enter your assigned sub-account passcode to access the workspace according to your role permissions.
          </p>
        </div>

        {/* Quick Staff Account Selector Pills */}
        {staffUsers.length > 0 && (
          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Select Sub-Account:
            </label>
            <div className="grid grid-cols-2 gap-2 text-left">
              {staffUsers.slice(0, 4).map((staff) => (
                <button
                  key={staff.id}
                  type="button"
                  onClick={() => handleQuickSelect(staff)}
                  className={`p-2 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStaffId === staff.id
                      ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  <span className="font-bold text-xs block truncate leading-tight">{staff.name}</span>
                  <div className="flex justify-between items-center mt-1">
                    <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${
                      selectedStaffId === staff.id ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {staff.role}
                    </span>
                    <span className="text-[9px] font-mono opacity-80">{staff.passcode}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Sub-Account Selector Dropdown */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-700 block">Select Sub-Account (Optional)</label>
            <select
              value={selectedStaffId}
              onChange={(e) => { setSelectedStaffId(e.target.value); setError(''); }}
              className="w-full bg-slate-50 border border-slate-200 focus:bg-white rounded-xl p-3 text-slate-900 font-semibold"
            >
              <option value="">&mdash; Any Active Account / Master Admin &mdash;</option>
              {staffUsers.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name} ({staff.designation || staff.role})
                </option>
              ))}
            </select>
          </div>

          {/* Passcode Field */}
          <div className="space-y-1.5 relative">
            <label className="font-bold text-slate-700 block">Enter Account Passcode</label>
            <div className="relative">
              <input
                type={showPasscode ? 'text' : 'password'}
                value={passcode}
                onChange={(e) => { setPasscode(e.target.value); setError(''); }}
                placeholder="Enter passcode (e.g. admin123, mgr123, sales123)"
                className="w-full pl-3.5 pr-10 py-3 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-hidden focus:border-blue-900 rounded-xl text-slate-900 font-mono font-bold tracking-wide transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasscode(!showPasscode)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Hint info */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-500 leading-normal flex gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-800 flex-shrink-0 mt-0.5" />
            <span>
              Passcodes: Master Admin (<b>admin123</b>), Manager (<b>mgr123</b>), Sales (<b>sales123</b>), Store Staff (<b>staff123</b>).
            </span>
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl text-center animate-shake">
              {error}
            </p>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-blue-900 hover:bg-blue-950 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all hover:scale-[1.01] shadow-xs cursor-pointer"
          >
            Authenticate & Open Workspace
          </button>
        </form>
      </div>

      {/* Slogan */}
      <div className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-8">
        "Your Problem Solution is Sustainable Partner"
      </div>
    </div>
  );
}
