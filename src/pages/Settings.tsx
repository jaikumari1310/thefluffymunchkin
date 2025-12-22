import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client.ts';
import { type Database } from '@/integrations/supabase/types';
import { Save, Copy, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const API_BASE_URL = `https://likthkgwdrvfsrthgzbw.supabase.co/functions/v1`;

type Settings = Database['public']['Tables']['settings']['Row'];

// We will use camelCase for the form state for easier handling in React
interface SettingsForm extends Omit<Settings, 'id' | 'created_at' | 'shop_name' | 'shop_address' | 'shop_phone' | 'shop_email' | 'shop_gstin' | 'invoice_prefix' | 'next_invoice_number' | 'state_code' | 'state_name' | 'bank_name' | 'bank_account' | 'bank_ifsc' | 'upi_id' | 'terms_and_conditions' | 'location_code' | 'terminal_id' | 'current_shift'> {
  shopName: string;
  shopAddress: string;
  shopPhone: string;
  shopEmail: string;
  shopGstin: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  stateCode: string;
  stateName: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  upiId: string;
  termsAndConditions: string;
  locationCode: string;
  terminalId: string;
  currentShift: string;
}

export default function SettingsPage() {
  const [formData, setFormData] = useState<Partial<SettingsForm>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  
  const apiKey = `tfm_${formData.locationCode || '01'}_${btoa(formData.shopName || 'shop').slice(0, 8)}`;

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .eq('id', 1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        // Map from snake_case (DB) to camelCase (form)
        setFormData({
          shopName: data.shop_name ?? '',
          shopAddress: data.shop_address ?? '',
          shopPhone: data.shop_phone ?? '',
          shopEmail: data.shop_email ?? '',
          shopGstin: data.shop_gstin ?? '',
          invoicePrefix: data.invoice_prefix ?? 'INV',
          nextInvoiceNumber: data.next_invoice_number ?? 1,
          stateCode: data.state_code ?? '27',
          stateName: data.state_name ?? 'Maharashtra',
          bankName: data.bank_name ?? '',
          bankAccount: data.bank_account ?? '',
          bankIfsc: data.bank_ifsc ?? '',
          upiId: data.upi_id ?? '',
          termsAndConditions: data.terms_and_conditions ?? '',
          locationCode: data.location_code ?? '01',
          terminalId: data.terminal_id ?? '01',
          currentShift: data.current_shift ?? '01',
        });
      }
    } catch (error: any) {
      console.error('Error loading settings:', error);
      toast.error('Failed to load settings', { description: error.message });
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Map from camelCase (form) to snake_case (DB)
      const settingsData = {
        id: 1, // Always upsert the same row
        shop_name: formData.shopName,
        shop_address: formData.shopAddress,
        shop_phone: formData.shopPhone,
        shop_email: formData.shopEmail,
        shop_gstin: formData.shopGstin,
        invoice_prefix: formData.invoicePrefix,
        next_invoice_number: formData.nextInvoiceNumber,
        state_code: formData.stateCode,
        state_name: formData.stateName,
        bank_name: formData.bankName,
        bank_account: formData.bankAccount,
        bank_ifsc: formData.bankIfsc,
        upi_id: formData.upiId,
        terms_and_conditions: formData.termsAndConditions,
        location_code: formData.locationCode,
        terminal_id: formData.terminalId,
        current_shift: formData.currentShift,
      };

      const { error } = await supabase.from('settings').upsert(settingsData);

      if (error) throw error;
      toast.success('Settings saved successfully');
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings', { description: error.message });
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
      <div className="mb-6 px-2 sm:px-0">
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your shop and invoice settings</p>
      </div>

      <div className="max-w-2xl space-y-4 sm:space-y-6 px-2 sm:px-0">
        {/* Shop Details */}
        <div className="stat-card">
          <h2 className="mb-4 text-base sm:text-lg font-semibold text-foreground">Shop Details</h2>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="shopName">Shop Name</Label>
              <Input
                id="shopName"
                value={formData.shopName}
                onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                placeholder="My Shop"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="shopAddress">Address</Label>
              <Textarea
                id="shopAddress"
                value={formData.shopAddress}
                onChange={(e) => setFormData({ ...formData, shopAddress: e.target.value })}
                placeholder="Shop address"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="shopPhone">Phone</Label>
              <Input
                id="shopPhone"
                value={formData.shopPhone}
                onChange={(e) => setFormData({ ...formData, shopPhone: e.target.value })}
                placeholder="+91 9876543210"
              />
            </div>
            <div>
              <Label htmlFor="shopEmail">Email</Label>
              <Input
                id="shopEmail"
                type="email"
                value={formData.shopEmail}
                onChange={(e) => setFormData({ ...formData, shopEmail: e.target.value })}
                placeholder="shop@email.com"
              />
            </div>
            <div>
              <Label htmlFor="shopGstin">GSTIN</Label>
              <Input
                id="shopGstin"
                value={formData.shopGstin}
                onChange={(e) => setFormData({ ...formData, shopGstin: e.target.value.toUpperCase() })}
                placeholder="22AAAAA0000A1Z5"
                maxLength={15}
              />
            </div>
            <div>
              <Label htmlFor="stateName">State</Label>
              <Input
                id="stateName"
                value={formData.stateName}
                onChange={(e) => setFormData({ ...formData, stateName: e.target.value })}
                placeholder="Maharashtra"
              />
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div className="stat-card">
          <h2 className="mb-4 text-base sm:text-lg font-semibold text-foreground">Invoice Settings</h2>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="invoicePrefix">Invoice Prefix</Label>
              <Input
                id="invoicePrefix"
                value={formData.invoicePrefix}
                onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value.toUpperCase() })}
                placeholder="INV"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Next invoice: {formData.invoicePrefix}-{String(formData.nextInvoiceNumber || 1).padStart(5, '0')}
              </p>
            </div>
            <div>
              <Label htmlFor="stateCode">State Code</Label>
              <Input
                id="stateCode"
                value={formData.stateCode}
                onChange={(e) => setFormData({ ...formData, stateCode: e.target.value })}
                placeholder="27"
                maxLength={2}
              />
            </div>
          </div>
        </div>

        {/* POS Patrol Integration */}
        <div className="stat-card border-2 border-primary/20">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-base sm:text-lg font-semibold text-foreground">POS Patrol Integration</h2>
            <Badge variant="secondary" className="text-xs">Mall API</Badge>
          </div>
          <p className="mb-4 text-xs sm:text-sm text-muted-foreground">
            Configure and share API access with mall management for sales reporting
          </p>
          
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            <div>
              <Label htmlFor="locationCode">Location Code</Label>
              <Input
                id="locationCode"
                value={formData.locationCode}
                onChange={(e) => setFormData({ ...formData, locationCode: e.target.value })}
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
                value={formData.terminalId}
                onChange={(e) => setFormData({ ...formData, terminalId: e.target.value })}
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
                value={formData.currentShift}
                onChange={(e) => setFormData({ ...formData, currentShift: e.target.value })}
                placeholder="01"
                maxLength={2}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Active shift number
              </p>
            </div>
          </div>

          <div className="mt-4 sm:mt-6 space-y-3 sm:space-y-4 rounded-lg bg-muted/50 p-3 sm:p-4">
            <h3 className="text-sm sm:text-base font-medium text-foreground">API Access Details</h3>
            
            <div>
              <Label className="text-xs sm:text-sm">API Endpoint URL</Label>
              <div className="mt-1 flex flex-col sm:flex-row gap-2">
                <Input
                  value={`${API_BASE_URL}/pos-patrol-api`}
                  readOnly
                  className="font-mono text-xs sm:text-sm bg-background flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto gap-2"
                  onClick={() => {
                    navigator.clipboard.writeText(`${API_BASE_URL}/pos-patrol-api`);
                    toast.success('API URL copied to clipboard');
                  }}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sm:hidden">Copy URL</span>
                </Button>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Share this URL with mall management
              </p>
            </div>

            <div>
              <Label className="text-xs sm:text-sm">API Key / Token</Label>
              <div className="mt-1 flex flex-col sm:flex-row gap-2">
                <Input
                  value={showApiKey ? apiKey : '••••••••••••••••'}
                  readOnly
                  className="font-mono text-xs sm:text-sm bg-background flex-1"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none gap-2"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sm:hidden">{showApiKey ? 'Hide' : 'Show'}</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(apiKey);
                      toast.success('API key copied to clipboard');
                    }}
                  >
                    <Copy className="h-4 w-4" />
                    <span className="sm:hidden">Copy</span>
                  </Button>
                </div>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Include in API requests as Authorization header
              </p>
            </div>

            <div>
              <Label className="text-xs sm:text-sm">Example API Request</Label>
              <div className="mt-1 rounded-md bg-background p-2 sm:p-3 font-mono text-[10px] sm:text-xs overflow-x-auto">
                <pre className="text-muted-foreground whitespace-pre-wrap break-all sm:whitespace-pre sm:break-normal">
{`GET ${API_BASE_URL}/pos-patrol-api?from_date=2024-12-01&to_date=2024-12-31`}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Bank Details */}
        <div className="stat-card">
          <h2 className="mb-4 text-base sm:text-lg font-semibold text-foreground">Bank Details (for invoices)</h2>
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                placeholder="State Bank of India"
              />
            </div>
            <div>
              <Label htmlFor="bankAccount">Account Number</Label>
              <Input
                id="bankAccount"
                value={formData.bankAccount}
                onChange={(e) => setFormData({ ...formData, bankAccount: e.target.value })}
                placeholder="1234567890"
              />
            </div>
            <div>
              <Label htmlFor="bankIfsc">IFSC Code</Label>
              <Input
                id="bankIfsc"
                value={formData.bankIfsc}
                onChange={(e) => setFormData({ ...formData, bankIfsc: e.target.value.toUpperCase() })}
                placeholder="SBIN0001234"
              />
            </div>
            <div>
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                value={formData.upiId}
                onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                placeholder="shop@upi"
              />
            </div>
          </div>
        </div>

        {/* Terms */}
        <div className="stat-card">
          <h2 className="mb-4 text-base sm:text-lg font-semibold text-foreground">Terms & Conditions</h2>
          <Textarea
            value={formData.termsAndConditions}
            onChange={(e) => setFormData({ ...formData, termsAndConditions: e.target.value })}
            placeholder="Enter terms and conditions to display on invoices..."
            rows={4}
          />
        </div>

        <Button onClick={handleSave} disabled={saving} className="w-full gap-2 mb-4">
          <Save className="h-4 w-4" />
          {saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </div>
    </AppLayout>
  );
}
