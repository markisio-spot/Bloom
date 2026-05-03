import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useGenerateLesson, useEarnCoins, useSaveProgress } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { LessonQuestion, GenerateLessonBodySubject } from "@workspace/api-client-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Coins, Loader2, Award, ArrowRight, CheckCircle, XCircle, Mic } from "lucide-react";

export default function Lessons() {
  const { user } = useAuth();
  const { toast } = useToast();

  const searchParams = new URLSearchParams(window.location.search);
  const initialSubject = (searchParams.get("subject") as GenerateLessonBodySubject) || GenerateLessonBodySubject.math;

  const [subject, setSubject] = useState<GenerateLessonBodySubject>(initialSubject);
  const [grade, setGrade] = useState("5");

  const [lessonData, setLessonData] = useState<{ questions: LessonQuestion[] } | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isQuestionSubmitted, setIsQuestionSubmitted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [score, setScore] = useState(0);

  const generateMutation = useGenerateLesson({
    mutation: {
      onSuccess: (data) => {
        setLessonData({ questions: data.questions });
        setCurrentQuestionIndex(0);
        setAnswers({});
        setIsQuestionSubmitted(false);
        setIsFinished(false);
        setScore(0);
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Error loading lesson",
          description: error.error || "Failed to load questions.",
        });
      }
    }
  });

  const earnCoinsMutation = useEarnCoins();
  const saveProgressMutation = useSaveProgress();

  const handleStart = () => {
    generateMutation.mutate({ data: { subject, level: parseInt(grade, 10) } });
  };

  const handleAnswer = (questionId: string, answer: string) => {
    if (isQuestionSubmitted) return;
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleCheckAnswer = () => {
    setIsQuestionSubmitted(true);
  };

  const handleNext = () => {
    if (!lessonData) return;
    setIsQuestionSubmitted(false);
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
      if (q.type === "speak") {
        const typed = (answers[q.id] || "").toLowerCase().trim();
        const expected = (q.correctAnswer || "").toLowerCase().trim();
        if (typed === expected || typed.includes(expected) || expected.includes(typed)) correct++;
      } else {
        if (answers[q.id] === q.correctAnswer) correct++;
      }
    });

    setScore(correct);
    setIsFinished(true);

    const earnedCoins = correct * 10;
    if (earnedCoins > 0) {
      earnCoinsMutation.mutate({ data: { amount: earnedCoins } }, {
        onSuccess: () => {
          toast({ title: "Coins earned!", description: `You earned ${earnedCoins} coins.` });
        }
      });
    }

    saveProgressMutation.mutate({
      data: { subject, level: parseInt(grade, 10), score: correct, exerciseType: "general" }
    });
  };

  if (isFinished && lessonData) {
    const total = lessonData.questions.length;
    const percentage = Math.round((score / total) * 100);
    const emoji = percentage >= 80 ? "🎉" : percentage >= 50 ? "👍" : "💪";

    return (
      <div className="container mx-auto p-4 max-w-2xl mt-12">
        <Card className="text-center shadow-lg border-primary/20">
          <CardHeader>
            <div className="mx-auto bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center mb-4 text-5xl">
              {emoji}
            </div>
            <CardTitle className="text-3xl font-extrabold text-primary">Lesson Complete!</CardTitle>
            <CardDescription className="text-lg">Great job pushing your limits.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-6xl font-black text-secondary">{percentage}%</div>
            <p className="text-xl text-muted-foreground">You scored {score} out of {total}</p>

            <div className="space-y-3 text-left mt-4">
              {lessonData.questions.map((q, i) => {
                let isCorrect = false;
                if (q.type === "speak") {
                  const typed = (answers[q.id] || "").toLowerCase().trim();
                  const expected = (q.correctAnswer || "").toLowerCase().trim();
                  isCorrect = typed === expected || typed.includes(expected) || expected.includes(typed);
                } else {
                  isCorrect = answers[q.id] === q.correctAnswer;
                }
                return (
                  <div key={q.id} className={`flex items-start gap-3 p-3 rounded-xl border ${isCorrect ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200"}`}>
                    {isCorrect
                      ? <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                      : <XCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />}
                    <div className="text-sm">
                      <p className="font-semibold text-foreground">{q.question}</p>
                      {!isCorrect && <p className="text-muted-foreground mt-0.5">Correct: <span className="font-bold text-green-700">{q.correctAnswer}</span></p>}
                    </div>
                  </div>
                );
              })}
            </div>

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
    const userAnswer = answers[question.id] || "";
    const isCorrect = question.type === "speak"
      ? userAnswer.toLowerCase().trim() === (question.correctAnswer || "").toLowerCase().trim()
        || userAnswer.toLowerCase().trim().includes((question.correctAnswer || "").toLowerCase().trim())
        || (question.correctAnswer || "").toLowerCase().trim().includes(userAnswer.toLowerCase().trim())
      : userAnswer === question.correctAnswer;
    const hasAnswer = userAnswer.trim().length > 0;

    return (
      <div className="container mx-auto p-4 max-w-3xl mt-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-primary capitalize">{subject} — Grade {grade}</h2>
          <span className="bg-primary/10 text-primary font-bold px-4 py-1.5 rounded-full">
            {currentQuestionIndex + 1} / {lessonData.questions.length}
          </span>
        </div>

        <Card className="shadow-md border-primary/10">
          <CardContent className="p-8 space-y-6">
            <h3 className="text-xl font-semibold">{question.question}</h3>

            {/* Multiple choice */}
            {question.type === "multiple_choice" && question.options && (
              <div className="space-y-3">
                {question.options.map((opt, i) => {
                  let cls = "w-full text-left p-4 rounded-xl border-2 transition-all font-medium text-lg ";
                  if (isQuestionSubmitted) {
                    if (opt === question.correctAnswer) {
                      cls += "border-green-500 bg-green-50 text-green-800";
                    } else if (opt === userAnswer) {
                      cls += "border-red-400 bg-red-50 text-red-700";
                    } else {
                      cls += "border-border text-muted-foreground opacity-50";
                    }
                  } else {
                    cls += userAnswer === opt
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-border hover:border-primary/30 hover:bg-primary/5";
                  }
                  return (
                    <button key={i} className={cls} onClick={() => handleAnswer(question.id, opt)} disabled={isQuestionSubmitted}>
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Fill blank / write */}
            {(question.type === "fill_blank" || question.type === "write") && (
              <Input
                value={userAnswer}
                onChange={(e) => handleAnswer(question.id, e.target.value)}
                placeholder="Type your answer here..."
                className={`text-lg p-6 ${isQuestionSubmitted ? (isCorrect ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50") : ""}`}
                disabled={isQuestionSubmitted}
              />
            )}

            {/* Speak — text fallback on web */}
            {question.type === "speak" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 rounded-xl bg-primary/5 border border-primary/20">
                  <Mic className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">Speaking exercise — say this phrase:</p>
                    <p className="text-2xl font-extrabold text-primary mt-1">{question.correctAnswer}</p>
                  </div>
                </div>
                <Input
                  value={userAnswer}
                  onChange={(e) => handleAnswer(question.id, e.target.value)}
                  placeholder="Type what you would say..."
                  className={`text-lg p-6 ${isQuestionSubmitted ? (isCorrect ? "border-green-500 bg-green-50" : "border-red-400 bg-red-50") : ""}`}
                  disabled={isQuestionSubmitted}
                />
              </div>
            )}

            {/* Feedback after submission */}
            {isQuestionSubmitted && (
              <div className={`flex items-start gap-3 p-4 rounded-xl border-2 ${isCorrect ? "bg-green-50 border-green-400" : "bg-red-50 border-red-400"}`}>
                {isCorrect
                  ? <CheckCircle className="w-6 h-6 text-green-600 shrink-0 mt-0.5" />
                  : <XCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />}
                <div>
                  <p className={`font-bold text-lg ${isCorrect ? "text-green-700" : "text-red-600"}`}>
                    {isCorrect ? "Correct!" : "Not quite."}
                  </p>
                  {!isCorrect && (
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Correct answer: <span className="font-bold text-green-700">{question.correctAnswer}</span>
                    </p>
                  )}
                  {(question as any).explanation && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{(question as any).explanation}</p>
                  )}
                </div>
              </div>
            )}

            {/* Action row */}
            <div className="flex justify-end pt-2">
              {!isQuestionSubmitted ? (
                <Button
                  size="lg"
                  className="font-bold gap-2 text-md"
                  onClick={handleCheckAnswer}
                  disabled={!hasAnswer}
                >
                  Check Answer
                </Button>
              ) : (
                <Button
                  size="lg"
                  className="font-bold gap-2 text-md"
                  onClick={handleNext}
                >
                  {currentQuestionIndex < lessonData.questions.length - 1 ? "Next Question" : "Finish"} <ArrowRight className="w-5 h-5" />
                </Button>
              )}
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
          <CardDescription className="text-lg">Pick a subject and grade to start a lesson.</CardDescription>
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
            <Label className="text-md font-bold">Grade Level (1–12)</Label>
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
              <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading...</>
            ) : (
              "Start Lesson"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
