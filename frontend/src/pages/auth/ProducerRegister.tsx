import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordField } from '@/components/ui/password-field';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const ProducerRegister: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    businessName: '',
    location: '',
    craftType: '',
    experience: '',
    story: ''
  });
  const [bank, setBank] = useState({
    bankAccountName: '',
    bankAccountNumber: '',
    bankIfsc: '',
    bankName: '',
    bankBranch: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get redirect URL from query params
  const searchParams = new URLSearchParams(location.search);
  const redirectUrl = searchParams.get('redirect') || '/';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleBankChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setBank({ ...bank, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.password ||
      !formData.businessName || !formData.location || !formData.craftType || !formData.experience || !formData.story) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: 'producer',
        phone: formData.phone,
        businessName: formData.businessName,
        location: formData.location,
        craftType: formData.craftType,
        experience: formData.experience,
        story: formData.story,
        productTypes: formData.craftType ? [formData.craftType] : [],
        bankAccountName: bank.bankAccountName,
        bankAccountNumber: bank.bankAccountNumber,
        bankIfsc: bank.bankIfsc,
        bankName: bank.bankName,
        bankBranch: bank.bankBranch,
      });
      toast.success('Registration successful! Please check your email to verify your account.');
      navigate('/verify-email?redirect=' + encodeURIComponent(redirectUrl));
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="font-merriweather text-2xl text-center">
              Become an Artisan Seller
            </CardTitle>
            <CardDescription className="font-poppins text-center">
              Join our community of rural and tribal artisans
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName" className="font-poppins">First Name</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="font-poppins">Last Name</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                    className="mt-1"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Bank Details */}
              <div className="p-4 rounded border bg-muted/30">
                <h3 className="font-poppins font-semibold mb-3">Bank Details</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="bankAccountName" className="font-poppins">Account Holder Name</Label>
                    <Input id="bankAccountName" name="bankAccountName" value={bank.bankAccountName} onChange={handleBankChange} className="mt-1" disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="bankAccountNumber" className="font-poppins">Account Number</Label>
                    <Input id="bankAccountNumber" name="bankAccountNumber" value={bank.bankAccountNumber} onChange={handleBankChange} className="mt-1" disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="bankIfsc" className="font-poppins">IFSC Code</Label>
                    <Input id="bankIfsc" name="bankIfsc" value={bank.bankIfsc} onChange={handleBankChange} className="mt-1" disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="bankName" className="font-poppins">Bank Name</Label>
                    <Input id="bankName" name="bankName" value={bank.bankName} onChange={handleBankChange} className="mt-1" disabled={isLoading} />
                  </div>
                  <div>
                    <Label htmlFor="bankBranch" className="font-poppins">Branch</Label>
                    <Input id="bankBranch" name="bankBranch" value={bank.bankBranch} onChange={handleBankChange} className="mt-1" disabled={isLoading} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-2">These details are kept secure and used for payouts only.</p>
              </div>

              <div>
                <Label htmlFor="businessName" className="font-poppins">Business/Artisan Name</Label>
                <Input
                  id="businessName"
                  name="businessName"
                  type="text"
                  value={formData.businessName}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="email" className="font-poppins">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="font-poppins">Phone Number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="location" className="font-poppins">Location (Village/City, State)</Label>
                <Input
                  id="location"
                  name="location"
                  type="text"
                  placeholder="e.g., Bastar, Chhattisgarh"
                  value={formData.location}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="craftType" className="font-poppins">Type of Craft/Products</Label>
                <Input
                  id="craftType"
                  name="craftType"
                  type="text"
                  placeholder="e.g., Pottery, Weaving, Jewelry Making"
                  value={formData.craftType}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="experience" className="font-poppins">Years of Experience</Label>
                <Input
                  id="experience"
                  name="experience"
                  type="number"
                  min="0"
                  value={formData.experience}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="story" className="font-poppins">Your Story</Label>
                <Textarea
                  id="story"
                  name="story"
                  rows={4}
                  placeholder="Tell us about your craft, tradition, and what makes your products special..."
                  value={formData.story}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="password" className="font-poppins">Password</Label>
                <PasswordField
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Password must be at least 6 characters long
                </p>
              </div>

              <div>
                <Label htmlFor="confirmPassword" className="font-poppins">Confirm Password</Label>
                <PasswordField
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white font-poppins"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Registering...
                  </>
                ) : (
                  <>
                    <Store className="h-5 w-5 mr-2" />
                    Register as Producer
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="font-poppins text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary/80">
                  Login here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProducerRegister;