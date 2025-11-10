import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { TribalDivider } from '@/components/ui/tribal-pattern';
import { toast } from 'sonner';
import { apiService } from '@/services/api';

const Contact: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setIsLoading(true);
      await apiService.submitContact({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
        subject: formData.subject,
        message: formData.message
      });

      toast.success('Message sent successfully! We\'ll get back to you soon.');

      // Reset form
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      toast.error(error.message || 'Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="bg-gradient-earth py-12">
        <div className="container mx-auto px-4">
          <h1 className="font-merriweather text-3xl md:text-4xl font-bold text-off-white text-center mb-4">
            Get in Touch
          </h1>
          <p className="font-poppins text-lg text-off-white/90 text-center">
            We'd love to hear from you
          </p>
        </div>
      </section>

      <TribalDivider className="text-primary -mt-px" />

      <div className="container mx-auto px-4 py-16">
        <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Contact Information */}
          <div>
            <h2 className="font-merriweather text-2xl font-bold text-primary mb-6">
              Contact Information
            </h2>
            <p className="font-poppins text-muted-foreground mb-8">
              Have questions about our platform? Want to partner with us? Or interested in
              becoming a seller? We're here to help!
            </p>

            <div className="space-y-6">
              <Card>
                <CardContent className="flex items-start p-6">
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-merriweather font-semibold mb-1">Email</h3>
                    <p className="font-poppins text-sm text-muted-foreground">
                      indicrafts2u@gmail.com
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start p-6">
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-merriweather font-semibold mb-1">Phone</h3>
                    <p className="font-poppins text-sm text-muted-foreground">
                      +91 74328 83118
                    </p>
                    <p className="font-poppins text-sm text-muted-foreground">
                      Mon-Sat: 9:00 AM - 6:00 PM IST
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="flex items-start p-6">
                  <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="h-5 w-5 text-primary" />
                  </div>
                  <div className="ml-4">
                    <h3 className="font-merriweather font-semibold mb-1">Office</h3>
                    <p className="font-poppins text-sm text-muted-foreground">
                      Center for Rural Development <br /> Indian Institute of Technology, Kharagpur<br />
                      Kharagpur - 721 302,<br />
                      West Bengal, India
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="font-merriweather text-2xl font-bold text-primary mb-6">
              Send us a Message
            </h2>

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
                <Label htmlFor="phone" className="font-poppins">Phone</Label>
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
                <Label htmlFor="subject" className="font-poppins">Subject</Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <div>
                <Label htmlFor="message" className="font-poppins">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="mt-1"
                  disabled={isLoading}
                />
              </div>

              <Button
                type="submit"
                size="lg"
                className="w-full bg-burnt-orange hover:bg-burnt-orange/90 text-white font-poppins"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5 mr-2" />
                    Send Message
                  </>
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;