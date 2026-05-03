import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useRegister } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username too long"),
  displayName: z.string().min(1, "Display name is required").max(30, "Display name too long"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function Register() {
  const { login } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      displayName: "",
      password: "",
    },
  });

  const registerMutation = useRegister({
    mutation: {
      onSuccess: (data) => {
        login(data.token);
        toast({
          title: "Account created!",
          description: "Welcome to Bloom. Let's start learning!",
        });
      },
      onError: (error) => {
        toast({
          variant: "destructive",
          title: "Registration failed",
          description: error.error || "An error occurred during registration.",
        });
      },
    },
  });

  function onSubmit(values: z.infer<typeof registerSchema>) {
    registerMutation.mutate({ data: values });
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold tracking-tight text-primary">Join Bloom</CardTitle>
          <CardDescription>Create an account to start earning coins and collecting animals.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username</FormLabel>
                    <FormControl>
                      <Input placeholder="Choose a username" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="What should we call you?" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Create a password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full font-bold text-md" disabled={registerMutation.isPending}>
                {registerMutation.isPending ? "Creating account..." : "Sign up"}
              </Button>
            </form>
          </Form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:text-secondary transition-colors">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
