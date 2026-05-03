import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { useGenerateLesson, useEarnCoins, useSaveProgress } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { LessonQuestion, GenerateLessonBodySubject } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Loader2, Award, ArrowRight } from "lucide-react";

export default function Lessons() {
  const { user } = useAuth();
  const [location] = useLocation();
  const { toast } = useToast();
  
  const searchParams = new URLSearchParams(window.location.search);
  const initialSubject = (searchParams.get("subject") as GenerateLessonBodySubject) || GenerateLessonBodySubject.math;

  const [subject, setSubject] = useState<GenerateLessonBodySubject>(initialSubject);
  const [grade, setGrade] = useState("5");
  
  const [lessonData, setLessonData] = useState<{ questions: LessonQuestion[] } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const generateMutation = useGenerateLesson({
    mutation: {
      onSuccess: (data) => {
        setLessonData({ questions: data.questions });
        setCurrentQuestionIndex(0);
        setAnswers({});
        setIsFinished(false);
        setScore(0);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error generating lesson",
          description: error.error || "Failed to load questions.",
        });
      }
    }
  });

  const earnCoinsMutation = useEarnCoins();
  const saveProgressMutation = useSaveProgress();

  const handleStart = () => {
    generateMutation.mutate({
      data: {
        subject,
        level: parseInt(grade, 10),
      }
    });
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (!lessonData) return;
    if (currentQuestionIndex < lessonData.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      finishLesson();
    }
  };

  const finishLesson = () => {
    if (!lessonData) return;
    let correct = 0;
    lessonData.questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });
    
    setScore(correct);
    setIsFinished(true);

    const earnedCoins = correct * 10; // 10 coins per correct answer
    
    if (earnedCoins > 0) {
      earnCoinsMutation.mutate({
        data: { amount: earnedCoins }
      }, {
        onSuccess: () => {
          toast({
            title: "Coins earned!",
            description: `You earned ${earnedCoins} coins.`,
          });
        }
      });
    }

    saveProgressMutation.mutate({
      data: {
        subject,
        level: parseInt(grade, 10),
        score: correct,
        exerciseType: "general"
      }
    });
  };

  if (isFinished && lessonData) {
    const total = lessonData.questions.length;
    const percentage = Math.round((score / total) * 100);
    
    return (
      <div className="container mx-auto p-4 max-w-2xl mt-12">
        <Card className="text-center shadow-lg border-primary/20 hover-elevate">
          <CardHeader>
            <div className="mx-auto bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-4">
              <Award className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-3xl font-extrabold text-primary">Lesson Complete!</CardTitle>
            <CardDescription className="text-lg">Great job pushing your limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-black text-secondary">
              {percentage}%
            </div>
            <p className="text-xl text-muted-foreground">
              You scored {score} out of {total}
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button variant="outline" onClick={() => { setLessonData(null); setIsFinished(false); }} className="font-bold">
                Back to Setup
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (lessonData) {
    const question = lessonData.questions[currentQuestionIndex];
    return (
      <div className="container mx-auto p-4 max-w-3xl mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary capitalize">{subject} - Grade {grade}</h2>
          <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full">
            Question {currentQuestionIndex + 1} of {lessonData.questions.length}
          </span>
        </div>

        <Card className="shadow-md border-primary/10">
          <CardContent className="p-8">
            <h3 className="text-xl font-semibold mb-6">{question.question}</h3>
            
            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-3">
                {question.options.map((opt, i) => (
                  <button
                    key={i}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-lg ${answers[question.id] === opt ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/30 hover:bg-primary/5'}`}
                    onClick={() => handleAnswer(question.id, opt)}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            )}

            {(question.type === "fill_blank" || question.type === "write") && (
              <Input
                value={answers[question.id] || ""}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder="Type your answer here..."
                className="text-lg p-6"
              />
            )}

            <div className="mt-8 flex justify-end">
              <Button 
                size="lg" 
                className="font-bold gap-2 text-md" 
                onClick={handleNext}
                disabled={!answers[question.id]}
              >
                {currentQuestionIndex < lessonData.questions.length - 1 ? 'Next Question' : 'Finish'} <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-xl mt-12">
      <Card className="shadow-lg border-primary/10">
        <CardHeader>
          <CardTitle className="text-3xl font-extrabold text-primary">Start a Lesson</CardTitle>
          <CardDescription className="text-lg">Pick a subject and grade to generate a custom AI lesson.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label className="text-md font-bold">Subject</Label>
            <Select value={subject} onValueChange={(v) => setSubject(v as GenerateLessonBodySubject)}>
              <SelectTrigger className="text-lg p-6">
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {Object.values(GenerateLessonBodySubject).map((s) => (
                  <SelectItem key={s} value={s} className="text-md capitalize">{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-md font-bold">Grade Level (1-12)</Label>
            <Input 
              type="number" 
              min={1} 
              max={12} 
              value={grade} 
              onChange={(e) => setGrade(e.target.value)} 
              className="text-lg p-6"
            />
          </div>

          <Button 
            className="w-full text-lg font-bold p-6" 
            onClick={handleStart}
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? (
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...</>
            ) : (
              "Generate Lesson"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
