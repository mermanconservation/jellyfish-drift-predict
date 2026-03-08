import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Heart, Building2, Copy, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Donate = () => {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
    });
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a2540' }}>
      <div className="container mx-auto px-6 py-16">
        {/* Back Button */}
        <div className="mb-8">
          <Button asChild variant="ghost" className="text-primary-foreground hover:bg-white/10">
            <Link to="/" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
        
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Donation Methods */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Stripe Card Payment */}
            <Card className="backdrop-blur-sm bg-card/90 border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-2">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
                <CardTitle>Credit Card</CardTitle>
                <CardDescription>Quick and secure payment with Stripe</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Fast, secure payment processing with all major credit cards accepted.
                </p>
                <Button 
                  className="w-full" 
                  onClick={() => window.open('https://buy.stripe.com/3cIbIUgvx6zmaTjdIPco000', '_blank')}
                >
                  Donate with Card
                </Button>
              </CardContent>
            </Card>

            {/* PayPal */}
            <Card className="backdrop-blur-sm bg-card/90 border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-accent/10 rounded-full flex items-center justify-center mb-2">
                  <Heart className="w-6 h-6 text-accent" />
                </div>
                <CardTitle>PayPal</CardTitle>
                <CardDescription>Donate using your PayPal account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground text-center">
                  Use your existing PayPal account for a familiar donation experience.
                </p>
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => window.open('https://www.paypal.com/paypalme/mermanconservation', '_blank')}
                >
                  Donate with PayPal
                </Button>
              </CardContent>
            </Card>

            {/* Bank Transfer */}
            <Card className="backdrop-blur-sm bg-card/90 border-border/50 hover:shadow-lg transition-shadow">
              <CardHeader className="text-center">
                <div className="w-12 h-12 mx-auto bg-coral/10 rounded-full flex items-center justify-center mb-2">
                  <Building2 className="w-6 h-6 text-coral" />
                </div>
                <CardTitle>Bank Transfer</CardTitle>
                <CardDescription>Direct bank transfer (IBAN)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Name:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">Merman Conservation Expeditions Ltd</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('Merman Conservation Expeditions Ltd', 'Name')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Account No:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">53869821</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('53869821', 'Account number')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sort Code:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">60 84 64</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('60 84 64', 'Sort code')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">IBAN:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs">GB09 TRWI 6084 6453 8698 21</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('GB09 TRWI 6084 6453 8698 21', 'IBAN')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Swift BIC:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">TRWIGB2LXXX</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyToClipboard('TRWIGB2LXXX', 'Swift BIC')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="pt-2 border-t">
                    <span className="text-muted-foreground text-xs">Bank Address: </span>
                    <span className="font-medium text-xs">56 Shoreditch High Street, London, UK</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Donate;