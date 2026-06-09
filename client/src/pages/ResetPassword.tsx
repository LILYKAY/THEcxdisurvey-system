import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ResetPassword() {
  const [, navigate] = useLocation();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = () => {
    if (!email) return;
    // Password reset is handled via Manus OAuth
    setSent(true);
    toast.info("Please use the login page to reset your password via OAuth");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-center text-blue-700">Reset Password</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {sent ? (
            <div className="text-center space-y-3">
              <p className="text-sm text-gray-600">Please use the login page to sign in and reset your password.</p>
              <Button variant="outline" onClick={() => navigate("/login")} className="w-full">Back to Login</Button>
            </div>
          ) : (
            <>
              <div>
                <Label>Email Address</Label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
              <Button onClick={handleSubmit} disabled={!email} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                Continue
              </Button>
              <Button variant="ghost" onClick={() => navigate("/login")} className="w-full text-gray-500">Back to Login</Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
