import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { getSettings, updateSettings, Settings } from '@/lib/db';
import { Save } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Partial<Settings>>({
    shopName: '',
    shopAddress: '',
    shopPhone: '',
    shopEmail: '',
    shopGstin: '',
    invoicePrefix: 'INV',
    stateCode: '27',
    stateName: 'Maharashtra',
    bankName: '',
    bankAccount: '',
    bankIfsc: '',
    upiId: '',
    termsAndConditions: '',
    locationCode: '01',
    terminalId: '01',
    currentShift: '01',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const data = await getSettings();
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure your shop and invoice settings</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Shop Details */}
        <div className="stat-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Shop Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={settings.shopName}
                onChange={(e) => setSettings({ ...settings, shopName: e.target.value })}
                placeholder="My Shop"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="shopAddress">Address</Label>
              <Textarea
                id="shopAddress"
                value={settings.shopAddress}
                onChange={(e) => setSettings({ ...settings, shopAddress: e.target.value })}
                placeholder="Shop address"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="shopPhone">Phone</Label>
              <Input
                id="shopPhone"
                value={settings.shopPhone}
                onChange={(e) => setSettings({ ...settings, shopPhone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <Label htmlFor="shopEmail">Email</Label>
              <Input
                id="shopEmail"
                type="email"
                value={settings.shopEmail}
                onChange={(e) => setSettings({ ...settings, shopEmail: e.target.value })}
                placeholder="shop@email.com"
              />
            </div>
            <div>
              <Label htmlFor="shopGstin">GSTIN</Label>
              <Input
                id="shopGstin"
                value={settings.shopGstin}
                onChange={(e) => setSettings({ ...settings, shopGstin: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
            <div>
              <Label htmlFor="stateName">State</Label>
              <Input
                id="stateName"
                value={settings.stateName}
                onChange={(e) => setSettings({ ...settings, stateName: e.target.value })}
                placeholder="Maharashtra"
              />
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="stat-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Invoice Settings</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                value={settings.invoicePrefix}
                onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value.toUpperCase() })}
                placeholder="INV"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Next invoice: {settings.invoicePrefix}-{String(settings.nextInvoiceNumber || 1).padStart(5, '0')}
              </p>
            </div>
            <div>
              <Label htmlFor="stateCode">State Code</Label>
              <Input
                id="stateCode"
                value={settings.stateCode}
                onChange={(e) => setSettings({ ...settings, stateCode: e.target.value })}
                placeholder="27"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* Kiosk Configuration (POS PATROL) */}
        <div className="stat-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Kiosk Configuration</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Configure POS PATROL integration settings for mall reporting
          </p>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label htmlFor="locationCode">Location Code</Label>
              <Input
                id="locationCode"
                value={settings.locationCode}
                onChange={(e) => setSettings({ ...settings, locationCode: e.target.value })}
                placeholder="01"
                maxLength={10}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Mall-assigned branch/store ID
              </p>
            </div>
            <div>
              <Label htmlFor="terminalId">Terminal ID</Label>
              <Input
                id="terminalId"
                value={settings.terminalId}
                onChange={(e) => setSettings({ ...settings, terminalId: e.target.value })}
                placeholder="01"
                maxLength={10}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                POS terminal identifier
              </p>
            </div>
            <div>
              <Label htmlFor="currentShift">Current Shift</Label>
              <Input
                id="currentShift"
                value={settings.currentShift}
                onChange={(e) => setSettings({ ...settings, currentShift: e.target.value })}
                placeholder="01"
                maxLength={2}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Active shift number
              </p>
            </div>
          </div>
        </div>
        <div className="stat-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Bank Details (for invoices)</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={settings.bankName}
                onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                placeholder="State Bank of India"
              />
            </div>
            <div>
              <Label htmlFor="bankAccount">Account Number</Label>
              <Input
                id="bankAccount"
                value={settings.bankAccount}
                onChange={(e) => setSettings({ ...settings, bankAccount: e.target.value })}
                placeholder="1234567890"
              />
            </div>
            <div>
              <Label htmlFor="bankIfsc">IFSC Code</Label>
              <Input
                id="bankIfsc"
                value={settings.bankIfsc}
                onChange={(e) => setSettings({ ...settings, bankIfsc: e.target.value.toUpperCase() })}
                placeholder="SBIN0001234"
              />
            </div>
            <div>
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                value={settings.upiId}
                onChange={(e) => setSettings({ ...settings, upiId: e.target.value })}
                placeholder="shop@upi"
              />
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="stat-card">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Terms & Conditions</h2>
          <Textarea
            value={settings.termsAndConditions}
            onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
            placeholder="Enter terms and conditions to display on invoices..."
            rows={4}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </AppLayout>
  );
}
