import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ThumbsUp, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { FeedbackSectionProps } from "./types";

const FeedbackSection: React.FC<FeedbackSectionProps> = ({ feedback, setFeedback, onSubmit }) => {
  const [submitted, setSubmitted] = useState(false);
  const [feedbackQuality, setFeedbackQuality] = useState(0);
  
  const handleSubmit = () => {
    setSubmitted(true);
    onSubmit();
    
    // Reset after showing success message
    setTimeout(() => {
      setSubmitted(false);
      setFeedback("");
    }, 3000);
  };
  
  // Calculate feedback quality based on length
  React.useEffect(() => {
    if (feedback.length === 0) {
      setFeedbackQuality(0);
    } else if (feedback.length < 20) {
      setFeedbackQuality(25);
    } else if (feedback.length < 50) {
      setFeedbackQuality(50);
    } else if (feedback.length < 100) {
      setFeedbackQuality(75);
    } else {
      setFeedbackQuality(100);
    }
  }, [feedback]);

  return (
    <section className="relative py-20" id="feedback">
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            We Value Your
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600 ml-2">
              Feedback
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Share your thoughts to help us improve WP.ai and make it even better for your WordPress needs.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto"
        >
          <Card className="relative overflow-hidden border-border/40 dark:border-border/20 backdrop-blur-sm">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-blue-600"></div>
            <CardContent className="p-6 md:p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold mb-4">How We Use Your Input</h3>
                  <p className="text-muted-foreground mb-6">
                    Your feedback directly influences our development roadmap and AI training.
                  </p>
                  
                  <div className="flex flex-col space-y-5">
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 bg-green-100 dark:bg-green-900/30 rounded-full p-2">
                        <ThumbsUp className="text-green-500 dark:text-green-400" size={18} />
                      </div>
                      <span>Prioritizing new WordPress automation features</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
                        <ThumbsUp className="text-blue-500 dark:text-blue-400" size={18} />
                      </div>
                      <span>Training our AI to better understand WordPress ecosystem</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/30 rounded-full p-2">
                        <ThumbsUp className="text-purple-500 dark:text-purple-400" size={18} />
                      </div>
                      <span>Improving accuracy of WordPress recommendations</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <AnimatePresence mode="wait">
                    {submitted ? (
                      <motion.div 
                        key="success"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex flex-col items-center justify-center text-center p-4"
                      >
                        <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-4 mb-4">
                          <CheckCircle2 className="h-12 w-12 text-green-500 dark:text-green-400" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Thank You!</h3>
                        <p className="text-muted-foreground">
                          Your feedback has been submitted successfully and will help us improve WP.ai.
                        </p>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="form"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col"
                      >
                        <div className="mb-1 flex justify-between items-center">
                          <label className="text-sm font-medium">Your Feedback</label>
                          <span className="text-xs text-muted-foreground">{feedback.length} characters</span>
                        </div>
                        
                        <Textarea
                          className="min-h-[180px] resize-none mb-2"
                          placeholder="Your feedback helps us improve. Share your thoughts, suggestions, or experiences with WP.ai..."
                          value={feedback}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFeedback(e.target.value)}
                        />
                        
                        <div className="mb-4">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Feedback Quality</span>
                            <span>{feedbackQuality}%</span>
                          </div>
                          <Progress value={feedbackQuality} className="h-1" />
                        </div>

                        <Button 
                          onClick={handleSubmit}
                          className="w-full group"
                          size="lg"
                          disabled={feedback.length < 10}
                        >
                          <Send size={16} className="mr-2 group-hover:translate-x-1 transition-transform" /> 
                          Submit Feedback
                        </Button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
    </section>
  );
};

export default FeedbackSection; 