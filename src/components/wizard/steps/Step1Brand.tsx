import { FormField } from "../FormField";

export function Step1Brand() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-text-primary">Brand & Product</h2>
                <p className="mt-2 text-sm text-text-secondary">
                    Let's start with basic information about your brand and product.
                </p>
            </div>

            <FormField
                name="brandName"
                label="Brand Name"
                placeholder="Greespi"
                required
            />

            <FormField
                name="productService"
                label="Product / Service"
                type="textarea"
                placeholder="Frozen microalgae-based smoothie cubes for gut health"
                helperText="Describe what you sell in 1-2 sentences. Be specific about the format and what makes it unique."
                required
            />

            <FormField
                name="productFormat"
                label="Product Format / Delivery"
                placeholder="Subscription box, 30-day supply, ships frozen"
                helperText="How is your product delivered to customers?"
                required
            />
        </div>
    );
}
