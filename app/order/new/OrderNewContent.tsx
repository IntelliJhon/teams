"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useOrderStore } from "@/store/order-store";
import { TopBar } from "@/components/TopBar";
import { toast } from "sonner";

export default function OrderNewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get("phone") ?? "";

  const {
    setHeader,
    customerPhone,
    customerName,
    customerAddress,
    dispatchDate,
    remarks,
  } = useOrderStore();

  const [name, setName] = useState(customerName);
  const [address, setAddress] = useState(customerAddress);
  const [phone, setPhone] = useState(customerPhone || phoneParam);
  const [date, setDate] = useState(dispatchDate);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Seed the phone from URL if provided
  useEffect(() => {
    if (phoneParam && !customerPhone) {
      setPhone(phoneParam);
      setHeader({ customerPhone: phoneParam });
    }
  }, [phoneParam, customerPhone, setHeader]);

  // Clean and validate Indian / standard 10-digit phone number
  const validatePhoneNumber = (input: string): { isValid: boolean; error?: string; formatted?: string } => {
    const raw = input.trim();
    if (!raw) {
      return { isValid: false, error: "Phone number is required." };
    }

    // Strip out all non-digits
    let digits = raw.replace(/\D/g, "");

    // Handle country code +91 or 0 prefix
    if (digits.startsWith("91") && digits.length === 12) {
      digits = digits.slice(2);
    } else if (digits.startsWith("0") && digits.length === 11) {
      digits = digits.slice(1);
    }

    if (digits.length < 10) {
      return { isValid: false, error: "Phone number must be exactly 10 digits." };
    }

    if (digits.length > 10) {
      return { isValid: false, error: "Phone number cannot exceed 10 digits." };
    }

    if (!/^[6-9]/.test(digits)) {
      return { isValid: false, error: "Mobile number must start with 6, 7, 8, or 9." };
    }

    return { isValid: true, formatted: digits };
  };

  const handlePhoneChange = (val: string) => {
    // Only allow numbers and optional leading +
    const sanitized = val.replace(/[^0-9+]/g, "").slice(0, 13);
    setPhone(sanitized);
    if (errors.phone) {
      setErrors((prev) => ({ ...prev, phone: "" }));
    }
  };

  const handleNext = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Customer name is required.";

    const phoneValidation = validatePhoneNumber(phone);
    if (!phoneValidation.isValid) {
      e.phone = phoneValidation.error || "Please enter a valid phone number.";
    }

    if (Object.keys(e).length > 0) {
      setErrors(e);
      const firstMsg = Object.values(e)[0];
      toast.error(firstMsg);
      return;
    }

    const cleanPhone = phoneValidation.formatted || phone.trim();

    setHeader({
      customerName: name.trim(),
      customerAddress: address.trim(),
      customerPhone: cleanPhone,
      dispatchDate: date || new Date().toISOString().split("T")[0],
    });

    router.push("/order/new/add-product");
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <div>
        <TopBar
          title="Welcome Screen"
          showMenu={true}
          showClose={true}
          onClose={() => {
            if (confirm("Reset order details?")) {
              setName("");
              setAddress("");
              setPhone("");
            }
          }}
        />

        <div className="px-5 pt-6 pb-28">
          <h2 className="text-2xl font-normal text-gray-900 mb-6">
            Enter Customer Details
          </h2>

          <div className="space-y-6">
            {/* Customer Name */}
            <div>
              <div
                className={`bg-white border rounded-xl px-4 py-3.5 transition-colors ${
                  errors.name ? "border-red-400" : "border-gray-500/80 focus-within:border-emerald-600"
                }`}
              >
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="Customer Name"
                  className="w-full text-base text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent"
                />
              </div>
              <p className="mt-1 text-xs px-1 font-normal">
                {errors.name ? (
                  <span className="text-red-500 font-medium">{errors.name}</span>
                ) : (
                  <span className="text-gray-500">Kindly Enter Text</span>
                )}
              </p>
            </div>

            {/* Address */}
            <div>
              <div
                className={`bg-white border rounded-xl px-4 py-3.5 transition-colors ${
                  errors.address ? "border-red-400" : "border-gray-500/80 focus-within:border-emerald-600"
                }`}
              >
                <textarea
                  value={address}
                  maxLength={600}
                  onChange={(e) => {
                    setAddress(e.target.value);
                    if (errors.address)
                      setErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  placeholder="Address"
                  rows={4}
                  className="w-full text-base text-gray-900 placeholder-gray-500 focus:outline-none resize-none bg-transparent"
                />
              </div>
              <div className="mt-1 flex items-center justify-between text-xs text-gray-500 px-1 font-normal">
                <span>Enter Long text</span>
                <span>{address.length} / 600</span>
              </div>
            </div>

            {/* Phone Number */}
            <div>
              <div
                className={`bg-white border rounded-xl px-4 py-3.5 transition-colors ${
                  errors.phone ? "border-red-400" : "border-gray-500/80 focus-within:border-emerald-600"
                }`}
              >
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full text-base text-gray-900 placeholder-gray-500 focus:outline-none bg-transparent tracking-wide"
                />
              </div>
              <p className="mt-1 text-xs px-1 font-normal">
                {errors.phone ? (
                  <span className="text-red-500 font-medium">{errors.phone}</span>
                ) : (
                  <span className="text-gray-500">Enter 10-digit mobile number</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Continue Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <button
          type="button"
          onClick={handleNext}
          className="w-full py-3.5 px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-medium text-base transition-colors shadow-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
