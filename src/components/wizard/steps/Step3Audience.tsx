import { FormField } from "../FormField";

export function Step3Audience() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Market & Audience</h2>
                <p className="mt-2 text-sm text-text-secondary">
                    Tell us about your target market and ideal customers.
                </p>
            </div>

            <FormField
                name="geography"
                label="Target Geography"
                placeholder="USA — urban areas, health-conscious cities (LA, NYC, Austin, Denver)"
                helperText="Where are your target customers located?"
                required
            />

            <FormField
                name="businessModel"
                label="Business Model"
                type="select"
                options={[
                    { value: "B2C", label: "B2C (Business to Consumer)" },
                    { value: "B2B", label: "B2B (Business to Business)" },
                    { value: "Both", label: "Both B2C and B2B" },
                ]}
                required
            />

            <FormField
                name="priceSegment"
                label="Price Segment"
                type="select"
                options={[
                    { value: "Mass Market", label: "Mass Market" },
                    { value: "Mid-Range", label: "Mid-Range" },
                    { value: "Premium", label: "Premium" },
                ]}
                required
            />

            <FormField
                name="idealCustomer"
                label="Ideal Customer (if known)"
                type="textarea"
                placeholder="Women 28-45, wellness-focused, tried probiotics before, shops at Whole Foods, follows health influencers"
                helperText="If you already have customers or assumptions — describe them. If not sure, leave empty and we'll help identify them."
            />
        </div>
    );
}
