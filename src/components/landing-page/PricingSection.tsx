import React from "react";
import { motion } from "framer-motion";
import PricingCard from "./PricingCard";
import { PLANS } from "./data";
import { PricingSectionProps } from "./types";

const PricingSection: React.FC<PricingSectionProps> = ({ onUpgrade }) => {
  return (
    <section className="relative py-20 sm:py-28 px-4 sm:px-6" id="pricing">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              Choose Your Plan
            </span>
          </h2>
          <p className="mt-4 text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Select the perfect plan that fits your WordPress optimization needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} onUpgrade={onUpgrade} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 