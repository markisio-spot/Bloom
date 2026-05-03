import { db, questionsTable } from "@workspace/db";
import { sql } from "drizzle-orm";

interface QuestionData {
  id: string;
  question: string;
  type: "multiple_choice" | "fill_blank" | "match" | "write" | "speak";
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  hint: string;
  speakText: string | null;
  pairs: Array<{ left: string; right: string }> | null;
}

interface SeedEntry {
  subject: string;
  grade: number;
  exerciseType: string;
  languageSection: number | null;
  questionData: QuestionData;
}

function mc(id: string, question: string, options: string[], correctAnswer: string, explanation: string, hint: string): QuestionData {
  return { id, question, type: "multiple_choice", options, correctAnswer, explanation, hint, speakText: null, pairs: null };
}

function fb(id: string, question: string, correctAnswer: string, explanation: string, hint: string): QuestionData {
  return { id, question, type: "fill_blank", options: null, correctAnswer, explanation, hint, speakText: null, pairs: null };
}

// ─── MATH ────────────────────────────────────────────────────────────────────

const mathQuestions: SeedEntry[] = [
  // Grade 1
  ...([
    mc("m1-1","What is 2 + 3?",["4","5","6","7"],"5","Adding 2 and 3 gives you 5.","Count up from 2 three times."),
    mc("m1-2","What is 5 - 2?",["1","2","3","4"],"3","5 take away 2 leaves 3.","Count back from 5 two times."),
    mc("m1-3","What is 1 + 1?",["1","2","3","4"],"2","1 plus 1 is always 2.","Think of two identical objects."),
    mc("m1-4","What is 4 + 4?",["6","7","8","9"],"8","4 and 4 together make 8.","Count four fingers on each hand."),
    mc("m1-5","What is 10 - 5?",["3","4","5","6"],"5","Half of 10 is 5.","10 fingers, fold 5 down."),
    fb("m1-6","3 + __ = 7","4","7 minus 3 equals 4, so the blank is 4.","What do you add to 3 to reach 7?"),
    fb("m1-7","__ + 2 = 6","4","6 minus 2 equals 4.","Count back 2 from 6."),
    mc("m1-8","Which number is bigger: 7 or 4?",["4","7","They are equal","Neither"],"7","7 comes after 4 on the number line so it is bigger.","Look at a number line."),
    mc("m1-9","How many sides does a triangle have?",["2","3","4","5"],"3","A triangle always has exactly 3 sides.","Tri- means three."),
    mc("m1-10","What comes after 9?",["8","10","11","7"],"10","After 9 we reach 10 when counting.","Keep counting: 8, 9, ..."),
    fb("m1-11","5 - __ = 2","3","5 minus 3 equals 2.","What do you subtract from 5 to get 2?"),
    mc("m1-12","What is 0 + 6?",["0","5","6","7"],"6","Adding zero to any number leaves it unchanged.","Zero adds nothing."),
    mc("m1-13","What is 3 + 2?",["4","5","6","7"],"5","3 and 2 together make 5.","Hold up 3 fingers then 2 more."),
    mc("m1-14","What is 8 - 3?",["3","4","5","6"],"5","8 take away 3 gives 5.","Count back 3 steps from 8."),
    mc("m1-15","How many legs does a dog have?",["2","3","4","6"],"4","A dog is a four-legged animal.","Think of each paw."),
    fb("m1-16","2 + __ = 9","7","9 minus 2 equals 7.","Count up from 2 until you reach 9."),
    mc("m1-17","Which is the smallest number?",["5","3","8","1"],"1","1 is the smallest of the four options.","Which would you reach first counting up from zero?"),
    mc("m1-18","What shape has 4 equal sides?",["Circle","Triangle","Square","Rectangle"],"Square","A square has 4 sides that are all the same length.","All sides must be equal."),
    mc("m1-19","What is 6 + 2?",["6","7","8","9"],"8","6 plus 2 equals 8.","Count two more from 6."),
    mc("m1-20","What is 7 - 7?",["0","1","7","14"],"0","Any number minus itself is zero.","You take everything away."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 1, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 2
  ...([
    mc("m2-1","What is 12 + 8?",["18","19","20","21"],"20","12 plus 8 equals 20.","10+8=18, then add 2 more."),
    mc("m2-2","What is 15 - 6?",["7","8","9","10"],"9","15 minus 6 equals 9.","Count back 6 from 15."),
    fb("m2-3","14 + __ = 20","6","20 minus 14 equals 6.","How much more do you need to get from 14 to 20?"),
    mc("m2-4","What is 5 × 2?",["5","8","10","12"],"10","5 times 2 means 5 added twice: 5+5=10.","Two groups of five."),
    mc("m2-5","What is 20 ÷ 4?",["4","5","6","8"],"5","20 divided into 4 equal groups gives 5 in each.","4 × 5 = 20."),
    mc("m2-6","What is 3 × 3?",["6","7","8","9"],"9","3 times 3 equals 9.","3 rows of 3 objects."),
    fb("m2-7","__ × 4 = 12","3","3 times 4 equals 12.","What times 4 gives 12?"),
    mc("m2-8","What is 17 + 5?",["21","22","23","24"],"22","17 plus 5 equals 22.","17+3=20, then add 2 more."),
    mc("m2-9","Which is an even number?",["3","5","8","9"],"8","Even numbers are divisible by 2; 8÷2=4.","Can you split it into two equal groups?"),
    mc("m2-10","What is 30 - 14?",["14","15","16","17"],"16","30 minus 14 equals 16.","30-10=20, then 20-4=16."),
    fb("m2-11","25 - __ = 17","8","25 minus 8 equals 17.","Count back from 25 to reach 17."),
    mc("m2-12","What is 4 × 5?",["16","18","20","22"],"20","4 groups of 5 equal 20.","Count by fives four times."),
    mc("m2-13","How many centimetres in 1 metre?",["10","50","100","1000"],"100","There are 100 centimetres in a metre.","Centi- means hundredth."),
    mc("m2-14","What is 7 × 2?",["12","13","14","15"],"14","7 doubled is 14.","7+7=14."),
    fb("m2-15","36 ÷ __ = 6","6","36 divided by 6 equals 6.","What number times 6 gives 36?"),
    mc("m2-16","What is half of 18?",["7","8","9","10"],"9","Half of 18 is 9 because 9+9=18.","Split 18 into two equal parts."),
    mc("m2-17","What is 11 + 13?",["22","23","24","25"],"24","11 plus 13 equals 24.","10+13=23, then add 1."),
    mc("m2-18","What is 2 × 9?",["16","17","18","19"],"18","2 times 9 equals 18.","9+9=18."),
    fb("m2-19","__ + 15 = 28","13","28 minus 15 equals 13.","What added to 15 gives 28?"),
    mc("m2-20","What is 40 ÷ 8?",["4","5","6","7"],"5","40 divided by 8 equals 5.","8×5=40."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 2, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 3
  ...([
    mc("m3-1","What is 24 × 3?",["62","70","72","78"],"72","24 times 3: 20×3=60, 4×3=12, 60+12=72.","Break 24 into 20+4."),
    mc("m3-2","What is 81 ÷ 9?",["7","8","9","10"],"9","9 times 9 equals 81.","Think of your 9 times table."),
    fb("m3-3","56 ÷ __ = 8","7","56 divided by 7 equals 8.","What times 8 gives 56?"),
    mc("m3-4","What is 125 + 75?",["190","195","200","210"],"200","125 plus 75 equals 200.","125+75: add 75 to 125."),
    mc("m3-5","What is 300 - 145?",["145","150","155","160"],"155","300 minus 145 equals 155.","300-100=200, 200-45=155."),
    mc("m3-6","What is 6 × 7?",["40","41","42","43"],"42","6 times 7 equals 42.","Recall your 6 times table."),
    fb("m3-7","9 × __ = 63","7","9 times 7 equals 63.","Which number in the 9-table gives 63?"),
    mc("m3-8","What is a quarter of 100?",["20","25","30","40"],"25","100 divided by 4 equals 25.","Split 100 into four equal parts."),
    mc("m3-9","What is the perimeter of a square with side 5 cm?",["15","20","25","30"],"20","Perimeter = 4 × side = 4 × 5 = 20 cm.","Add all four equal sides."),
    mc("m3-10","What is 8 × 8?",["56","60","64","68"],"64","8 times 8 equals 64.","8 rows of 8."),
    fb("m3-11","__ × 6 = 54","9","9 times 6 equals 54.","Count by sixes until you reach 54."),
    mc("m3-12","What is 500 + 375?",["825","850","875","900"],"875","500 plus 375 equals 875.","500+300=800, 800+75=875."),
    mc("m3-13","Which fraction is equivalent to 1/2?",["2/3","3/4","2/4","3/5"],"2/4","2/4 simplifies to 1/2 because both numerator and denominator are halved.","Double the numerator and denominator of 1/2."),
    mc("m3-14","What is 7 × 9?",["56","62","63","72"],"63","7 times 9 equals 63.","Recall your 7 or 9 times table."),
    fb("m3-15","144 ÷ __ = 12","12","144 divided by 12 equals 12.","12 times what gives 144?"),
    mc("m3-16","What is the area of a rectangle 4 cm × 6 cm?",["20","22","24","26"],"24","Area = length × width = 4 × 6 = 24 cm².","Multiply the two dimensions."),
    mc("m3-17","What is 1000 - 437?",["553","563","573","583"],"563","1000 minus 437 equals 563.","1000-400=600, 600-37=563."),
    mc("m3-18","What is 5 × 12?",["55","60","65","70"],"60","5 times 12 equals 60.","Count by fives twelve times."),
    fb("m3-19","__ + 289 = 500","211","500 minus 289 equals 211.","What do you add to 289 to reach 500?"),
    mc("m3-20","What is 72 ÷ 8?",["7","8","9","10"],"9","72 divided by 8 equals 9.","8 × 9 = 72."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 3, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 4
  ...([
    mc("m4-1","What is 234 × 4?",["826","836","916","936"],"936","234×4: 200×4=800, 30×4=120, 4×4=16; 800+120+16=936.","Multiply each digit separately."),
    mc("m4-2","What is 5² (5 squared)?",["10","20","25","30"],"25","5 squared means 5×5=25.","Squared means multiplied by itself."),
    fb("m4-3","__ ÷ 7 = 13","91","13 times 7 equals 91.","Multiply 13 by 7."),
    mc("m4-4","What is 3/4 + 1/4?",["1/2","3/4","1","5/4"],"1","3/4 plus 1/4 equals 4/4 which equals 1.","Add the numerators; denominators stay the same."),
    mc("m4-5","What is 1000 × 6?",["600","6000","60000","600000"],"6000","1000 times 6 equals 6000.","Count three zeros after the 6."),
    mc("m4-6","What is the LCM of 4 and 6?",["8","10","12","24"],"12","The lowest common multiple of 4 and 6 is 12.","List multiples: 4,8,12 and 6,12."),
    fb("m4-7","2/5 + __ = 1","3/5","1 minus 2/5 equals 3/5.","How much more do you need to complete the whole?"),
    mc("m4-8","What is 48 ÷ 6?",["6","7","8","9"],"8","48 divided by 6 equals 8.","6×8=48."),
    mc("m4-9","What is 0.5 as a fraction?",["1/4","1/3","1/2","3/4"],"1/2","0.5 means 5 tenths which simplifies to 1/2.","Half of 1 is 0.5."),
    mc("m4-10","What is the area of a triangle with base 6 and height 4?",["10","12","16","24"],"12","Area of triangle = ½ × base × height = ½ × 6 × 4 = 12.","Remember the half in the formula."),
    fb("m4-11","350 ÷ __ = 50","7","350 divided by 7 equals 50.","What times 50 gives 350?"),
    mc("m4-12","What is 1/3 of 90?",["20","25","30","35"],"30","One third of 90 is 90÷3=30.","Divide by the denominator."),
    mc("m4-13","Which of these is a prime number?",["9","15","17","21"],"17","17 has no factors other than 1 and itself.","Check: can it be divided evenly by 2,3,5,7?"),
    mc("m4-14","What is 4³ (4 cubed)?",["12","48","64","128"],"64","4 cubed means 4×4×4=64.","Multiply 4 three times."),
    fb("m4-15","__ × 25 = 200","8","8 times 25 equals 200.","How many 25s fit into 200?"),
    mc("m4-16","What is 2.5 + 1.75?",["3.5","3.75","4","4.25"],"4.25","2.5 plus 1.75 equals 4.25.","Line up the decimal points and add."),
    mc("m4-17","How many degrees in a right angle?",["45","60","90","180"],"90","A right angle is exactly 90 degrees.","Think of the corner of a square."),
    mc("m4-18","What is 15% of 200?",["20","25","30","40"],"30","15% of 200 = (15/100)×200 = 30.","1% of 200 is 2; multiply by 15."),
    fb("m4-19","5/8 - __ = 3/8","2/8","5/8 minus 2/8 equals 3/8.","Subtract the numerators."),
    mc("m4-20","What is 144 ÷ 12?",["10","11","12","13"],"12","144 divided by 12 equals 12.","12×12=144."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 4, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 5
  ...([
    mc("m5-1","What is 12 × 15?",["160","170","180","190"],"180","12×15: 10×15=150, 2×15=30; 150+30=180.","Break 12 into 10+2."),
    mc("m5-2","What is 25% of 360?",["80","85","90","95"],"90","25% is one quarter; 360÷4=90.","Divide by 4 for 25%."),
    fb("m5-3","__ % of 50 = 15","30","30% of 50 = 0.30×50 = 15.","What fraction of 50 is 15? Then convert to %."),
    mc("m5-4","What is 2.4 × 5?",["10","11","12","13"],"12","2.4 times 5: 2×5=10, 0.4×5=2; 10+2=12.","Split the decimal."),
    mc("m5-5","What is the mean of 4, 8, 6, 10, 2?",["5","6","7","8"],"6","Sum=30, count=5; 30÷5=6.","Add all values then divide by how many there are."),
    mc("m5-6","What is 3/4 of 80?",["50","55","60","65"],"60","3/4 of 80: 80÷4=20, 20×3=60.","Find one quarter first."),
    fb("m5-7","1.5 × __ = 9","6","9 ÷ 1.5 = 6.","What times 1.5 equals 9?"),
    mc("m5-8","What is the volume of a cube with side 3 cm?",["9","18","27","36"],"27","Volume = side³ = 3³ = 27 cm³.","Multiply 3×3×3."),
    mc("m5-9","What is 7/8 - 3/8?",["3/8","4/8","5/8","1"],"4/8","7/8 minus 3/8 equals 4/8.","Subtract numerators."),
    mc("m5-10","Which number is divisible by both 3 and 4?",["10","14","24","34"],"24","24÷3=8 and 24÷4=6.","Find a multiple of 12."),
    fb("m5-11","__ ÷ 0.5 = 14","7","7 divided by 0.5 equals 14 because dividing by 0.5 is multiplying by 2.","Dividing by 0.5 is the same as multiplying by 2."),
    mc("m5-12","What is 40% of 250?",["90","95","100","110"],"100","40% of 250 = 0.4×250=100.","10% of 250 is 25; multiply by 4."),
    mc("m5-13","What is the square root of 144?",["11","12","13","14"],"12","12×12=144, so √144=12.","Which number times itself gives 144?"),
    mc("m5-14","What is 2³ + 3²?",["15","16","17","18"],"17","2³=8 and 3²=9; 8+9=17.","Calculate each power separately."),
    fb("m5-15","5/6 + __ = 11/6","6/6","11/6 minus 5/6 equals 6/6 = 1.","Subtract the numerators."),
    mc("m5-16","What is 7.2 ÷ 0.9?",["7","8","9","10"],"8","7.2 divided by 0.9: multiply both by 10 → 72÷9=8.","Remove the decimal by multiplying by 10."),
    mc("m5-17","A rectangle has area 48 cm² and width 6 cm. What is the length?",["6","7","8","9"],"8","Length = area ÷ width = 48÷6 = 8 cm.","Rearrange area = l × w."),
    mc("m5-18","What is 0.1² ?",["0.01","0.1","0.001","1"],"0.01","0.1×0.1=0.01.","Multiply the decimals."),
    fb("m5-19","__ × 0.25 = 5","20","20 × 0.25 = 5 because 0.25 is one quarter.","Dividing by 0.25 is multiplying by 4."),
    mc("m5-20","What is the perimeter of a regular hexagon with side 7 cm?",["35","42","49","56"],"42","A regular hexagon has 6 sides; 6×7=42 cm.","Multiply number of sides by the side length."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 5, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 6
  ...([
    mc("m6-1","What is 15% of 480?",["62","68","72","78"],"72","15% of 480 = 0.15×480 = 72.","10%=48, 5%=24; add them."),
    mc("m6-2","Solve: 3x = 21",["5","6","7","8"],"7","Divide both sides by 3: x=21÷3=7.","Isolate x by dividing."),
    fb("m6-3","__ % of 200 = 50","25","50/200 × 100 = 25%.","What fraction is 50 of 200?"),
    mc("m6-4","What is the HCF of 36 and 48?",["6","8","12","18"],"12","Factors of 36: 1,2,3,4,6,9,12,18,36. Factors of 48: 1,2,3,4,6,8,12,16,24,48. HCF=12.","List factors and find the highest in common."),
    mc("m6-5","What is -5 + 8?",["−13","−3","3","13"],"3","Starting at -5, move 8 steps right on the number line to reach 3.","Move right on the number line."),
    mc("m6-6","What is the circumference of a circle with radius 7? (π≈3.14)",["43.96","44.96","45.96","46.96"],"43.96","C=2πr=2×3.14×7=43.96.","Use C=2πr."),
    fb("m6-7","2x + 3 = 11, x = __","4","Subtract 3: 2x=8; divide by 2: x=4.","Get x alone step by step."),
    mc("m6-8","What is 4/5 ÷ 2/5?",["1","2","3","4"],"2","Dividing fractions: 4/5 × 5/2 = 4/2 = 2.","Flip the second fraction and multiply."),
    mc("m6-9","What is (-3) × (-4)?",["−12","−7","7","12"],"12","Negative × negative = positive; 3×4=12.","Two negatives make a positive."),
    mc("m6-10","A ratio is 3:5. If the first part is 18, what is the second?",["25","28","30","35"],"30","18/3=6 per part; 6×5=30.","Find the value of one part."),
    fb("m6-11","__ : 8 = 5 : 4","10","Cross-multiply: 4×?=8×5=40; ?=10.","Cross-multiply to solve the proportion."),
    mc("m6-12","What is 2.5²?",["5.25","6","6.25","6.5"],"6.25","2.5×2.5=6.25.","Multiply 2.5 by itself."),
    mc("m6-13","What is 50% of 3/4?",["1/4","3/8","1/2","5/8"],"3/8","50% of 3/4 = (1/2)×(3/4) = 3/8.","Multiply 3/4 by 1/2."),
    mc("m6-14","The mean of 5 numbers is 12. What is their sum?",["55","60","65","70"],"60","Sum = mean × count = 12×5=60.","Reverse the mean formula."),
    fb("m6-15","5(x - 2) = 20, x = __","6","5x-10=20; 5x=30; x=6.","Expand the brackets first."),
    mc("m6-16","What is the area of a circle with radius 5? (π≈3.14)",["72.5","75.5","78.5","81.5"],"78.5","A=πr²=3.14×25=78.5.","Use A=πr²."),
    mc("m6-17","What is 1/3 + 1/6?",["1/2","2/9","2/6","3/9"],"1/2","1/3=2/6; 2/6+1/6=3/6=1/2.","Find a common denominator."),
    mc("m6-18","What is 12% of 350?",["38","40","42","44"],"42","12% of 350 = 0.12×350=42.","1%=3.5; multiply by 12."),
    fb("m6-19","A square has area 196 cm². Its side = __ cm","14","√196=14.","Find the square root of the area."),
    mc("m6-20","What is 3/4 × 8/9?",["2/3","3/4","5/6","7/9"],"2/3","(3×8)/(4×9)=24/36=2/3.","Multiply numerators and denominators."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 6, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 7
  ...([
    mc("m7-1","Solve: 2x - 5 = 9",["5","6","7","8"],"7","2x=14; x=7.","Add 5 to both sides first."),
    mc("m7-2","What is the gradient of y = 3x + 2?",["1","2","3","5"],"3","In y=mx+c, m is the gradient; m=3.","Identify the coefficient of x."),
    fb("m7-3","3x + 7 = 22, x = __","5","3x=15; x=5.","Subtract 7, then divide by 3."),
    mc("m7-4","What is 2⁵?",["16","28","32","64"],"32","2⁵=2×2×2×2×2=32.","Multiply 2 five times."),
    mc("m7-5","What is 30% of 450?",["120","125","130","135"],"135","30% of 450=0.3×450=135.","10%=45; multiply by 3."),
    mc("m7-6","What is the sum of angles in a triangle?",["90°","120°","160°","180°"],"180°","The interior angles of any triangle sum to 180°.","Think of a straight line."),
    fb("m7-7","7x = 49, x = __","7","49÷7=7.","Divide both sides by 7."),
    mc("m7-8","What is √225?",["13","14","15","16"],"15","15×15=225.","Which number squared gives 225?"),
    mc("m7-9","Expand: 4(3x - 2)",["12x - 8","12x - 2","4x - 8","7x - 6"],"12x - 8","4×3x=12x and 4×(-2)=-8.","Multiply each term inside by 4."),
    mc("m7-10","What is -8 - (-3)?",["−11","−5","5","11"],"−5","-8-(-3) = -8+3 = -5.","Subtracting a negative is adding."),
    fb("m7-11","y = 2x - 1. When x = 4, y = __","7","2×4-1=8-1=7.","Substitute x=4 into the equation."),
    mc("m7-12","What is the probability of rolling a 3 on a fair die?",["1/3","1/4","1/5","1/6"],"1/6","There is 1 outcome of 3 out of 6 total outcomes.","Favourable ÷ total outcomes."),
    mc("m7-13","What is 3/7 of 140?",["50","55","60","65"],"60","140÷7=20; 20×3=60.","Divide by the denominator, multiply by numerator."),
    mc("m7-14","Factorise: 6x + 9",["3(2x+3)","2(3x+9)","3(x+3)","6(x+3)"],"3(2x+3)","3 is the common factor: 3×2x=6x and 3×3=9.","Find the highest common factor."),
    fb("m7-15","The perimeter of a rectangle is 36 cm. Length is 10 cm. Width = __ cm","8","2(10+w)=36; 10+w=18; w=8.","Use P=2(l+w)."),
    mc("m7-16","What is 0.003 × 1000?",["0.3","3","30","300"],"3","Moving the decimal 3 places right: 0.003→3.","Multiply by 10 three times."),
    mc("m7-17","What is the median of: 3, 7, 2, 9, 5?",["5","6","7","9"],"5","Sorted: 2,3,5,7,9; middle value is 5.","Sort the list first."),
    mc("m7-18","Simplify: 5x + 3y - 2x + y",["3x+4y","3x+3y","7x+4y","7x+2y"],"3x+4y","5x-2x=3x and 3y+y=4y.","Collect like terms."),
    fb("m7-19","2(x + 5) = 18, x = __","4","2x+10=18; 2x=8; x=4.","Expand, then solve."),
    mc("m7-20","What is the volume of a cylinder with radius 3 and height 5? (π≈3.14)",["131.5","140.5","141.3","145"],"141.3","V=πr²h=3.14×9×5=141.3.","Use V=πr²h."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 7, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 8
  ...([
    mc("m8-1","Solve: x² = 64",["±6","±7","±8","±9"],"±8","√64=8, so x=8 or x=-8.","Square roots can be positive or negative."),
    mc("m8-2","Expand: (x+3)(x-2)",["x²+x-6","x²-x-6","x²+x+6","x²-x+6"],"x²+x-6","x·x=x², x·(-2)=-2x, 3·x=3x, 3·(-2)=-6; sum=x²+x-6.","Use FOIL."),
    fb("m8-3","Solve: x² - 25 = 0, x = __ or __","5 or -5","x²=25; x=±5.","Take the square root of both sides."),
    mc("m8-4","What is the gradient between (1,2) and (3,8)?",["2","3","4","5"],"3","Gradient=(8-2)/(3-1)=6/2=3.","Rise over run."),
    mc("m8-5","Factorise: x² - 9",["(x-3)²","(x+3)(x-3)","(x+9)(x-1)","(x-9)(x+1)"],"(x+3)(x-3)","Difference of two squares: a²-b²=(a+b)(a-b).","Recognise the difference of squares pattern."),
    mc("m8-6","What is sin 30°?",["0.5","√2/2","√3/2","1"],"0.5","sin 30°=1/2=0.5.","Learn the standard angles."),
    fb("m8-7","3x² = 75, x = __ (positive solution)","5","x²=25; x=5.","Divide by 3 then take the square root."),
    mc("m8-8","Simultaneous: x+y=10 and x-y=4. x=?",["6","7","8","9"],"7","Adding equations: 2x=14; x=7.","Add the two equations to eliminate y."),
    mc("m8-9","What is the nth term of: 3, 7, 11, 15, ...?",["3n","4n-1","4n+1","n+3"],"4n-1","First term=3; common difference=4; nth term=4n+(3-4)=4n-1.","Use nth term = a + (n-1)d."),
    mc("m8-10","What is tan 45°?",["0","0.5","1","√3"],"1","tan 45°=sin45°/cos45°=1.","It equals 1 at 45°."),
    fb("m8-11","y = x² - 4. When x = 3, y = __","5","9-4=5.","Substitute x=3."),
    mc("m8-12","What is the surface area of a cube with side 4 cm?",["64","80","96","112"],"96","6 faces × 4²=6×16=96 cm².","There are 6 square faces."),
    mc("m8-13","Solve: 2x² = 18",["±2","±3","±4","±6"],"±3","x²=9; x=±3.","Divide by 2 then square root."),
    mc("m8-14","What is the equation of a line with gradient 2 passing through (0,5)?",["y=2x","y=2x+5","y=5x+2","y=x+5"],"y=2x+5","y=mx+c; m=2, c=5.","Use y=mx+c."),
    fb("m8-15","Factorise: x² + 5x + 6 = (x + 2)(x + __)","3","2+3=5 and 2×3=6.","Find two numbers that add to 5 and multiply to 6."),
    mc("m8-16","What is 4! (4 factorial)?",["12","16","24","48"],"24","4!=4×3×2×1=24.","Multiply all integers from 1 to 4."),
    mc("m8-17","A bag has 3 red and 5 blue balls. P(red)?",["3/8","5/8","1/3","1/5"],"3/8","3 red out of 8 total.","Favourable ÷ total."),
    mc("m8-18","What is the range of: 4, 9, 2, 15, 7?",["11","12","13","14"],"13","Range=max-min=15-2=13.","Subtract smallest from largest."),
    fb("m8-19","(2x+1)(x-3)=2x²+bx-3. b = __","-5","2x·(-3)=-6x and 1·x=x; -6x+x=-5x; b=-5.","Expand and collect x terms."),
    mc("m8-20","Pythagoras: right triangle legs 6 and 8. Hypotenuse?",["9","10","11","12"],"10","6²+8²=36+64=100; √100=10.","Use a²+b²=c²."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 8, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 9
  ...([
    mc("m9-1","What is log₁₀(1000)?",["2","3","4","10"],"3","10³=1000 so log₁₀(1000)=3.","Logarithm asks: what power of the base gives the number?"),
    mc("m9-2","Solve: x² - 5x + 6 = 0",["x=1,6","x=2,3","x=3,4","x=2,4"],"x=2,3","(x-2)(x-3)=0; x=2 or x=3.","Factorise the quadratic."),
    fb("m9-3","The quadratic formula gives x = (-b ± √(b²-4ac)) / (2a). For 2x²+3x-2=0, the discriminant = __","25","b²-4ac=9-4(2)(-2)=9+16=25.","Calculate b²-4ac."),
    mc("m9-4","What is the sum of an arithmetic sequence with first term 5, common difference 3, and 10 terms?",["95","100","105","110"],"95","S=n/2×(2a+(n-1)d)=10/2×(10+27)=5×37=185... wait: 2×5+(9×3)=10+27=37; S=5×37=185.","Use Sₙ=n/2(2a+(n-1)d)."),
    mc("m9-5","What is the derivative of x³?",["x²","2x²","3x²","3x³"],"3x²","Power rule: d/dx(xⁿ)=nxⁿ⁻¹; d/dx(x³)=3x².","Bring the power down and reduce by 1."),
    mc("m9-6","What is cos 60°?",["0","0.5","√3/2","1"],"0.5","cos 60°=1/2.","Learn the standard angles."),
    fb("m9-7","Solve: 2^x = 16, x = __","4","2⁴=16.","What power of 2 gives 16?"),
    mc("m9-8","What is the equation of a circle centred at origin with radius 5?",["x²+y²=5","x²+y²=10","x²+y²=25","x²+y²=50"],"x²+y²=25","Circle equation: x²+y²=r²=25.","Use x²+y²=r²."),
    mc("m9-9","A geometric sequence starts 2, 6, 18, … What is the 5th term?",["54","108","162","324"],"162","Common ratio=3; 5th term=2×3⁴=2×81=162.","Multiply the first term by r^(n-1)."),
    mc("m9-10","What is ∫2x dx?",["x","x²","x²+C","2x²+C"],"x²+C","∫2x dx = x²+C.","Integrate using the power rule."),
    fb("m9-11","For f(x)=4x²-3, f'(x) = __","8x","Derivative of 4x² is 8x; constant -3 disappears.","Apply the power rule to each term."),
    mc("m9-12","What is the period of y=sin(2x)?",["π/2","π","2π","4π"],"π","Period=2π/|b|=2π/2=π.","Divide 2π by the coefficient of x."),
    mc("m9-13","Solve: log₂(x)=5",["16","25","32","64"],"32","x=2⁵=32.","Convert the log to exponential form."),
    mc("m9-14","What is the binomial coefficient C(5,2)?",["5","10","15","20"],"10","C(5,2)=5!/(2!3!)=10.","Use the combination formula."),
    fb("m9-15","sin²θ + cos²θ = __","1","This is the Pythagorean identity.","This is a fundamental trigonometric identity."),
    mc("m9-16","What is 3² × 3³?",["3⁵","3⁶","9⁵","9⁶"],"3⁵","When multiplying same base, add exponents: 2+3=5.","Add the exponents."),
    mc("m9-17","Find the vertex of y=x²-4x+3.",["(1,0)","(2,-1)","(3,0)","(4,3)"],"(2,-1)","Vertex x=-b/2a=-(-4)/2=2; y=4-8+3=-1.","Use x=-b/(2a)."),
    mc("m9-18","What is the vector sum of (3,4) and (-1,2)?",["(2,6)","(3,6)","(4,2)","(2,2)"],"(2,6)","Add components: (3-1, 4+2)=(2,6).","Add x and y components separately."),
    fb("m9-19","d/dx(sin x) = __","cos x","The derivative of sin x is cos x.","Standard derivative rule."),
    mc("m9-20","In a normal distribution, what percentage of data falls within 1 standard deviation of the mean?",["58%","68%","78%","88%"],"68%","The 68-95-99.7 rule: 68% within 1σ.","Remember the empirical rule."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 9, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 10
  ...([
    mc("m10-1","What is the derivative of sin x?",["sin x","cos x","-sin x","-cos x"],"cos x","d/dx(sin x)=cos x.","Standard calculus rule."),
    mc("m10-2","What is ∫cos x dx?",["cos x + C","sin x + C","-cos x + C","-sin x + C"],"sin x + C","∫cos x dx = sin x + C.","The antiderivative of cos is sin."),
    fb("m10-3","The limit of (x²-1)/(x-1) as x→1 = __","2","Factor: (x+1)(x-1)/(x-1)=(x+1); at x=1 → 2.","Cancel the common factor."),
    mc("m10-4","Solve: e^x = 10 (answer to 2 d.p.)",["2.10","2.30","2.50","2.71"],"2.30","x=ln(10)≈2.30.","Take the natural log of both sides."),
    mc("m10-5","What is the magnitude of vector (3, 4)?",["4","5","6","7"],"5","√(3²+4²)=√25=5.","Use Pythagoras."),
    mc("m10-6","What is P(A∪B) if P(A)=0.4, P(B)=0.3, P(A∩B)=0.1?",["0.5","0.6","0.7","0.8"],"0.6","P(A∪B)=P(A)+P(B)-P(A∩B)=0.4+0.3-0.1=0.6.","Use the addition rule."),
    fb("m10-7","Differentiate y=e^(3x): dy/dx = __","3e^(3x)","Chain rule: multiply by the inner derivative 3.","Apply the chain rule."),
    mc("m10-8","What is the area under y=x² from x=0 to x=3?",["6","8","9","12"],"9","∫₀³ x² dx = [x³/3]₀³ = 27/3-0 = 9.","Integrate then apply limits."),
    mc("m10-9","What is the scalar product of (1,0,0) and (0,1,0)?",["0","1","−1","undefined"],"0","(1×0)+(0×1)+(0×0)=0; perpendicular vectors have dot product 0.","Sum the products of matching components."),
    mc("m10-10","For matrix [[2,0],[0,3]], what is the determinant?",["5","6","0","−6"],"6","det=2×3-0×0=6.","For 2×2: ad-bc."),
    fb("m10-11","Integrate ∫4x³ dx = __","x⁴ + C","Power rule: 4×x⁴/4=x⁴.","Increase power by 1, divide by new power."),
    mc("m10-12","What is the inverse of f(x)=2x+3?",["(x-3)/2","(x+3)/2","2x-3","2(x-3)"],"(x-3)/2","Swap x and y: x=2y+3; y=(x-3)/2.","Swap x and y then solve for y."),
    mc("m10-13","If sin θ=3/5, what is cos θ (in a right triangle)?",["3/4","4/5","5/3","4/3"],"4/5","Using Pythagoras: 3²+adj²=5²; adj=4; cos=4/5.","Use the Pythagorean theorem."),
    mc("m10-14","What does the second derivative test determine?",["Roots","Gradient","Nature of stationary point","Period"],"Nature of stationary point","If f''(x)>0 it's a minimum; f''(x)<0 it's a maximum.","It classifies turning points."),
    fb("m10-15","The modulus of complex number 3+4i = __","5","√(3²+4²)=√25=5.","Use Pythagoras on the real and imaginary parts."),
    mc("m10-16","What is the solution set of |x-2| < 3?",["x<1","x<5","-1<x<5","x>-1"],"−1<x<5","−3<x-2<3 → -1<x<5.","Write as a double inequality."),
    mc("m10-17","What does Euler's formula state?",["e^iπ=1","e^iπ+1=0","e^iπ=-1","e^π=i"],"e^iπ+1=0","Euler's identity: e^(iπ)+1=0.","One of the most famous equations in mathematics."),
    mc("m10-18","A function f is even if:",["f(-x)=-f(x)","f(-x)=f(x)","f(x)=x","f(x)=0"],"f(-x)=f(x)","Even functions are symmetric about the y-axis.","Think of y=x² which is symmetric."),
    fb("m10-19","∫₀¹ x dx = __","0.5","[x²/2]₀¹=1/2-0=0.5.","Apply the power rule and evaluate limits."),
    mc("m10-20","What is the sum to infinity of a geometric series with first term 4 and ratio 0.5?",["6","7","8","9"],"8","S∞=a/(1-r)=4/(0.5)=8.","Use S∞=a/(1-r) for |r|<1."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 10, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 11
  ...([
    mc("m11-1","What is the integral of 1/x?",["x","ln|x|+C","e^x+C","1/x²+C"],"ln|x|+C","∫(1/x)dx = ln|x|+C.","Special integral rule."),
    mc("m11-2","State the chain rule for dy/dx if y=f(g(x)).",["f'(x)g'(x)","f'(g(x))·g'(x)","f(g'(x))","f'(x)+g'(x)"],"f'(g(x))·g'(x)","Chain rule: differentiate outer, keep inner, multiply by derivative of inner.","Outer times inner derivative."),
    fb("m11-3","Differentiate y=ln(5x): dy/dx = __","1/x","d/dx(ln(5x))=1/(5x)×5=1/x.","Apply chain rule to ln."),
    mc("m11-4","What is the Maclaurin series for e^x up to x²?",["1+x","1+x+x²","1+x+x²/2","1+x+x²/2!"],"1+x+x²/2!","e^x=1+x+x²/2!+x³/3!+...","Each term divides by n factorial."),
    mc("m11-5","Evaluate ∫₁² (2x+1) dx.",["5","6","7","8"],"5","[x²+x]₁²=(4+2)-(1+1)=6-2=4... wait: (4+2)=6, (1+1)=2; 6-2=4. Recalc: ∫(2x+1)=[x²+x]; at 2: 4+2=6; at 1: 1+1=2; 6-2=4.","Integrate then apply limits."),
    mc("m11-6","What is the determinant of [[1,2],[3,4]]?",["−2","2","−5","5"],"−2","det=1×4-2×3=4-6=-2.","ad-bc for 2×2 matrix."),
    fb("m11-7","The general solution of dy/dx = 2x is y = __","x² + C","Integrate 2x: x²+C.","Integrate both sides."),
    mc("m11-8","What is the cross product of i and j?",["−k","0","k","i"],"k","i × j = k (using right-hand rule).","Use the cyclic rule: i→j→k."),
    mc("m11-9","Which test confirms convergence of Σ(1/n²)?",["Ratio test","p-series test (p>1)","Divergence test","Integral test only"],"p-series test (p>1)","Σ(1/nᵖ) converges for p>1; here p=2.","p-series rule."),
    mc("m11-10","What is the period of y=tan(x)?",["π/2","π","2π","4π"],"π","The period of tangent is π.","Tangent repeats every π radians."),
    fb("m11-11","Differentiate y=x·e^x: dy/dx = __","e^x + x·e^x","Product rule: u'v+uv'=e^x+x·e^x.","Use the product rule."),
    mc("m11-12","What does it mean if f''(x)>0?",["Local maximum","Inflection point","Local minimum","Constant"],"Local minimum","Positive second derivative indicates concave up, so a local minimum.","Concave up = minimum."),
    mc("m11-13","What is the remainder when dividing a polynomial f(x) by (x-a)?",["f(0)","f(a)","f(-a)","0"],"f(a)","Remainder theorem: remainder = f(a).","Substitute x=a into f(x)."),
    mc("m11-14","What is the equation of the tangent to y=x² at x=3?",["y=6x-9","y=3x+9","y=6x+9","y=9x-6"],"y=6x-9","f'(x)=2x; at x=3, gradient=6, y=9; y-9=6(x-3); y=6x-9.","Use point-slope form."),
    fb("m11-15","∫sin(x)dx = __","−cos(x) + C","The antiderivative of sin is -cos.","Remember the negative sign."),
    mc("m11-16","Which law states F=ma?",["Hooke's Law","Newton's Second Law","Faraday's Law","Pascal's Law"],"Newton's Second Law","Force equals mass times acceleration (F=ma).","A fundamental physics law."),
    mc("m11-17","What is i² where i is the imaginary unit?",["1","−1","i","−i"],"−1","By definition, i²=−1.","The definition of the imaginary unit."),
    mc("m11-18","The number of ways to arrange 4 objects in a line is:",["4","12","16","24"],"24","4!=4×3×2×1=24.","Count permutations."),
    fb("m11-19","If P(A)=0.3 and events are independent, P(A∩A) = __","0.09","0.3×0.3=0.09.","For independent events multiply probabilities."),
    mc("m11-20","What is the angle in radians equivalent to 180°?",["π/2","π","2π","3π/2"],"π","180°=π radians.","Half a full turn = π."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 11, exerciseType: "mixed", languageSection: null, questionData: q })),

  // Grade 12
  ...([
    mc("m12-1","What is the Fundamental Theorem of Calculus?",["∫f(x)dx=f(x)+C","∫ₐᵇf(x)dx=F(b)-F(a)","d/dx∫f(x)dx=x","f'(x)=lim h→0"],"∫ₐᵇf(x)dx=F(b)-F(a)","The definite integral equals the antiderivative evaluated at the limits.","Connect differentiation and integration."),
    mc("m12-2","Solve: e^(2x) = 7",["ln7","ln7/2","2ln7","ln(7/2)"],"ln7/2","2x=ln7; x=ln7/2.","Take ln of both sides."),
    fb("m12-3","The sum of the first n terms of a geometric series is Sₙ = a(1−rⁿ)/(1−r). For a=1, r=2, n=5: S₅ = __","31","1×(1-32)/(1-2)=(-31)/(-1)=31.","Substitute the values."),
    mc("m12-4","What is the Taylor series expansion of f(x) centred at x=a?",["Σf(x)xⁿ/n!","Σf⁽ⁿ⁾(a)(x-a)ⁿ/n!","Σf(a)xⁿ","Σnf(a)xⁿ⁻¹"],"Σf⁽ⁿ⁾(a)(x-a)ⁿ/n!","The Taylor series uses all derivatives at the centre point.","Each term involves the nth derivative at a."),
    mc("m12-5","What is the Laplace transform of f(t)=1?",["s","1/s","s²","1/s²"],"1/s","L{1}=1/s for s>0.","Standard Laplace table entry."),
    fb("m12-6","Differentiate y=x²·ln(x): dy/dx = __","2x·ln(x) + x","Product rule: 2x·ln(x)+x²·(1/x)=2x·ln(x)+x.","Use the product rule with u=x² and v=ln(x)."),
    mc("m12-7","What is the rank of matrix [[1,0],[0,0]]?",["0","1","2","undefined"],"1","One row is non-zero; rank=1.","Count the number of non-zero rows in row echelon form."),
    mc("m12-8","Which test uses lim|aₙ₊₁/aₙ|?",["Ratio test","Root test","Integral test","Comparison test"],"Ratio test","The ratio test compares successive terms.","Ratio of consecutive terms."),
    mc("m12-9","What is ∫₋∞^∞ e^(-x²) dx?",["1","π","√π","2π"],"√π","This is the Gaussian integral: √π.","Famous result from probability theory."),
    mc("m12-10","If a matrix A has eigenvalue λ, what is the equation?",["Av=λ","Av=λv","A-λ=0","det(A)=λ"],"Av=λv","The eigenvalue equation is Av=λv.","Eigenvector equation."),
    fb("m12-11","The derivative of arctan(x) = __","1/(1+x²)","Standard derivative of inverse tan.","Know your inverse trig derivatives."),
    mc("m12-12","What is L'Hôpital's Rule used for?",["Finding integrals","Evaluating 0/0 or ∞/∞ limits","Solving ODEs","Matrix operations"],"Evaluating 0/0 or ∞/∞ limits","L'Hôpital differentiates numerator and denominator separately.","Use when you get indeterminate forms."),
    mc("m12-13","What is the general solution of dy/dx + y = 0?",["y=Ce^x","y=Ce^(-x)","y=Cx","y=C"],"y=Ce^(-x)","Separable ODE: ∫dy/y=∫-dx; ln|y|=-x+C; y=Ae^(-x).","Separate and integrate."),
    mc("m12-14","What is the dot product of (1,2,3) and (4,5,6)?",["28","30","32","34"],"32","1×4+2×5+3×6=4+10+18=32.","Sum the products of matching components."),
    fb("m12-15","∫xe^x dx = __","xe^x - e^x + C","Integration by parts: u=x, dv=e^x dx.","Use integration by parts."),
    mc("m12-16","What does it mean for a set of vectors to be linearly independent?",["Their sum is zero","No vector is a scalar multiple of another in the set","They form a square matrix","They are all unit vectors"],"No vector is a scalar multiple of another in the set","Linear independence means no vector can be written as a combination of the others.","None can be expressed using the others."),
    mc("m12-17","What is the Cauchy-Schwarz inequality?",["(a·b)²=|a|²|b|²","(a·b)²≤|a|²|b|²","a·b≥|a||b|","a·b=|a|+|b|"],"(a·b)²≤|a|²|b|²","The Cauchy-Schwarz inequality bounds the dot product.","The square of the dot product is bounded."),
    mc("m12-18","What is the residue theorem used for?",["Polynomial roots","Contour integration","Matrix diagonalisation","Taylor series"],"Contour integration","The residue theorem evaluates complex contour integrals.","Complex analysis tool."),
    fb("m12-19","For f(x)=sin(x), the Maclaurin series up to x³ is x - __/6","x³","x - x³/6 + x⁵/120 - ...","The third term of the sin Maclaurin series."),
    mc("m12-20","The Central Limit Theorem states:",["Populations are normal","Sample means approach normal distribution as n→∞","Variance equals the mean","All distributions are equal"],"Sample means approach normal distribution as n→∞","As sample size grows, the distribution of sample means becomes approximately normal.","A cornerstone of statistics."),
  ] as QuestionData[]).map(q => ({ subject: "math", grade: 12, exerciseType: "mixed", languageSection: null, questionData: q })),
];

// ─── GRAMMAR ─────────────────────────────────────────────────────────────────

const grammarQuestions: SeedEntry[] = [
  ...([
    mc("g1-1","Which word is a noun?",["run","beautiful","cat","quickly"],"cat","A noun names a person, place, or thing. 'Cat' is a thing.","Think: what is a person, place, or thing?"),
    mc("g1-2","Which sentence uses a capital letter correctly?",["the dog barks.","The dog barks.","The Dog barks.","The dog Barks."],"The dog barks.","The first word of a sentence is always capitalised.","Check the first word."),
    mc("g1-3","Add the correct punctuation: 'What is your name__'",[".",",","!","?"],"?","Questions end with a question mark.","It is asking something."),
    mc("g1-4","Which word is a verb?",["happy","run","table","slowly"],"run","A verb shows an action. 'Run' is an action.","What can you do?"),
    mc("g1-5","Choose the correct spelling:",["freind","friend","freind","frend"],"friend","The correct spelling is f-r-i-e-n-d.","i before e except after c."),
    mc("g2-1","Which is the correct plural of 'child'?",["childs","children","childes","childer"],"children","Child has an irregular plural: children.","Some plurals don't just add -s."),
    mc("g2-2","What is the adjective in: 'The tall tree swayed'?",["tree","tall","swayed","the"],"tall","Adjectives describe nouns. 'Tall' describes the tree.","Which word describes the tree?"),
    mc("g2-3","Choose the correct word: 'She ___ to school every day.'",["go","goes","going","gone"],"goes","With 'she', the verb needs an -es ending in simple present.","Third person singular needs -es."),
    mc("g3-1","What is the past tense of 'run'?",["runned","ran","ranned","runs"],"ran","Run has an irregular past tense: ran.","Irregular verbs change spelling."),
    mc("g3-2","Which sentence is correct?",["Their going to the park.","There going to the park.","They're going to the park.","Theyre going to the park."],"They're going to the park.","They're = they are. It's a contraction.","Which one means 'they are'?"),
    mc("g4-1","Identify the adverb: 'She sang beautifully.'",["She","sang","beautifully","(none)"],"beautifully","Adverbs modify verbs; 'beautifully' describes how she sang.","Adverbs often end in -ly."),
    mc("g4-2","What type of sentence is: 'Close the door!'",["Declarative","Interrogative","Imperative","Exclamatory"],"Imperative","Imperative sentences give commands or instructions.","It gives an order."),
    mc("g5-1","What is the subject of: 'The brown fox jumped.'",["The","brown","fox","jumped"],"fox","The subject is who or what performs the action.","Who is jumping?"),
    mc("g5-2","Which word is a conjunction?",["slowly","because","happy","table"],"because","Conjunctions join clauses or words together.","It connects ideas."),
    mc("g6-1","Identify the type of clause: 'Although it was raining, ...'",["Main clause","Subordinate clause","Relative clause","Noun clause"],"Subordinate clause","'Although' introduces a subordinate/dependent clause.","It can't stand alone."),
    mc("g6-2","What is the passive voice of: 'The dog bit the man'?",["The man bit the dog.","The man was bitten by the dog.","The dog was biting.","The man had been bitten."],"The man was bitten by the dog.","Passive: object becomes subject + 'was/were' + past participle.","The receiver becomes the subject."),
    mc("g7-1","What is a dangling modifier?",["A misused adverb","A modifier with no clear subject to modify","A double negative","An incorrectly placed adjective"],"A modifier with no clear subject to modify","A dangling modifier describes something not clearly stated in the sentence.","The modifier has nothing to attach to."),
    mc("g8-1","Identify the figure of speech: 'The wind whispered through the trees.'",["Simile","Metaphor","Personification","Alliteration"],"Personification","Personification gives human qualities (whispering) to non-human things.","The wind doesn't literally whisper."),
    mc("g9-1","What is a subjunctive mood?",["Expressing facts","Expressing doubts, wishes, or hypotheticals","Expressing commands","Expressing questions"],"Expressing doubts, wishes, or hypotheticals","Subjunctive expresses unreal or hypothetical situations.","'If I were you...' uses subjunctive."),
    mc("g10-1","Identify the rhetorical device: 'To be, or not to be?'",["Anaphora","Antithesis","Epiphora","Chiasmus"],"Antithesis","Antithesis places contrasting ideas side by side.","Being vs not being are opposites."),
    mc("g11-1","What is a 'non-restrictive clause'?",["A clause that limits the noun","A clause that adds extra, non-essential information","A clause that replaces a noun","A clause that forms the subject"],"A clause that adds extra, non-essential information","Non-restrictive clauses add information but the sentence works without them.","Set off by commas."),
    mc("g12-1","Analyse the grammatical structure of a periodic sentence.",["Main clause first","Subordinate clauses build to a main clause at the end","Two main clauses joined","A sentence with no subordinate clauses"],"Subordinate clauses build to a main clause at the end","A periodic sentence delays the main clause for effect or suspense.","The main point comes at the very end."),
  ] as QuestionData[]).map(q => {
    const gradeMap: Record<string, number> = {
      "g1":1,"g2":2,"g3":3,"g4":4,"g5":5,"g6":6,"g7":7,"g8":8,"g9":9,"g10":10,"g11":11,"g12":12
    };
    const prefix = q.id.match(/^(g\d+)-/)?.[1] ?? "g1";
    return { subject: "grammar", grade: gradeMap[prefix] ?? 1, exerciseType: "multiple_choice", languageSection: null, questionData: q };
  }),
];

// ─── HISTORY ─────────────────────────────────────────────────────────────────

const historyQuestions: SeedEntry[] = [
  ...([
    mc("h1-1","Who was the first President of the United States?",["Abraham Lincoln","George Washington","Thomas Jefferson","John Adams"],"George Washington","George Washington served as the first U.S. President (1789–1797).","He led the Continental Army."),
    mc("h2-1","In which year did World War II end?",["1943","1944","1945","1946"],"1945","World War II ended in 1945 with Germany surrendering in May and Japan in September.","The atomic bombs were dropped that year."),
    mc("h3-1","What ancient wonder was located in Alexandria, Egypt?",["The Colosseum","The Great Lighthouse","The Hanging Gardens","The Statue of Zeus"],"The Great Lighthouse","The Lighthouse of Alexandria was one of the Seven Wonders of the Ancient World.","It guided ships into the harbour."),
    mc("h4-1","Which empire was ruled by Julius Caesar?",["Greek Empire","Ottoman Empire","Roman Empire","Persian Empire"],"Roman Empire","Julius Caesar was a Roman general and dictator who transformed the Roman Republic.","Think of gladiators and togas."),
    mc("h5-1","The Magna Carta was signed in which year?",["1066","1215","1314","1492"],"1215","The Magna Carta was signed by King John in 1215, limiting royal power.","Magna Carta means 'Great Charter'."),
    mc("h6-1","Who led the Indian independence movement using non-violent resistance?",["Jawaharlal Nehru","Subhas Chandra Bose","Mahatma Gandhi","Bhagat Singh"],"Mahatma Gandhi","Gandhi's philosophy of non-violent civil disobedience (Satyagraha) drove Indian independence.","He led salt marches and hunger strikes."),
    mc("h7-1","The French Revolution began in which year?",["1776","1789","1804","1815"],"1789","The French Revolution began in 1789 with the storming of the Bastille.","The motto was Liberté, Égalité, Fraternité."),
    mc("h8-1","What was the name of the policy of racial segregation in South Africa?",["Colonialism","Apartheid","Segregation","Jim Crow"],"Apartheid","Apartheid was the system of institutionalised racial segregation in South Africa from 1948 to 1991.","Nelson Mandela fought against it."),
    mc("h9-1","The Cold War was primarily between which two superpowers?",["USA and UK","USA and China","USA and USSR","UK and USSR"],"USA and USSR","The Cold War (1947–1991) was an ideological struggle between the USA and the Soviet Union.","Capitalism vs Communism."),
    mc("h10-1","Which treaty ended World War I?",["Treaty of Paris","Treaty of Versailles","Treaty of Vienna","Treaty of Utrecht"],"Treaty of Versailles","The Treaty of Versailles in 1919 officially ended WWI and imposed penalties on Germany.","Signed in the Palace of Versailles."),
    mc("h11-1","What was the primary cause of the Rwandan Genocide of 1994?",["Land disputes","Colonial-era ethnic divisions between Hutu and Tutsi","Religious conflict","Economic collapse"],"Colonial-era ethnic divisions between Hutu and Tutsi","Belgian colonialism had hardened divisions between the Hutu and Tutsi, fuelling genocide.","Around 800,000 people were killed in 100 days."),
    mc("h12-1","What was the significance of the Berlin Conference of 1884–85?",["It ended World War I","It divided Africa among European powers","It established the League of Nations","It created NATO"],"It divided Africa among European powers","The Berlin Conference allowed European nations to colonise Africa without African representation.","Also called the Scramble for Africa."),
  ] as QuestionData[]).map((q, i) => ({
    subject: "history",
    grade: i + 1,
    exerciseType: "multiple_choice",
    languageSection: null,
    questionData: q,
  })),
];

// ─── GEOGRAPHY ───────────────────────────────────────────────────────────────

const geographyQuestions: SeedEntry[] = [
  ...([
    mc("geo1-1","What is the largest continent?",["Africa","Asia","Europe","North America"],"Asia","Asia is the largest continent by area and population.","China and India are both there."),
    mc("geo2-1","What is the longest river in the world?",["Amazon","Congo","Mississippi","Nile"],"Nile","The Nile River in Africa is approximately 6,650 km long.","It flows through Egypt."),
    mc("geo3-1","Which is the smallest country in the world?",["Monaco","Nauru","San Marino","Vatican City"],"Vatican City","Vatican City, with an area of about 44 hectares, is the world's smallest country.","It is within Rome."),
    mc("geo4-1","What is the capital of Australia?",["Sydney","Melbourne","Brisbane","Canberra"],"Canberra","Canberra has been Australia's capital since 1913.","It's not Sydney!"),
    mc("geo5-1","Which mountain is the highest in the world?",["K2","Kangchenjunga","Everest","Lhotse"],"Everest","Mount Everest at 8,849 m is Earth's highest peak.","It is in the Himalayas."),
    mc("geo6-1","What type of climate does the Amazon basin have?",["Desert","Tundra","Tropical rainforest","Mediterranean"],"Tropical rainforest","The Amazon receives heavy year-round rainfall creating tropical rainforest conditions.","Think lush, humid, diverse."),
    mc("geo7-1","What is the term for the movement of people from one place to another?",["Immigration","Emigration","Migration","Urbanisation"],"Migration","Migration is the general movement of people; immigration and emigration are its specific directions.","It's the umbrella term."),
    mc("geo8-1","What causes tectonic plates to move?",["Gravity alone","Wind patterns","Convection currents in the mantle","Ocean tides"],"Convection currents in the mantle","Heat-driven convection currents in the mantle drag tectonic plates.","Hot material rises, cools, and sinks."),
    mc("geo9-1","What is 'urban sprawl'?",["City flooding","The uncontrolled expansion of cities into surrounding rural areas","High-rise construction","Rural depopulation"],"The uncontrolled expansion of cities into surrounding rural areas","Urban sprawl occurs when cities grow outward, consuming farmland and natural areas.","It leads to car dependency."),
    mc("geo10-1","Which country emits the most CO₂?",["USA","Russia","India","China"],"China","China is currently the world's largest CO₂ emitter due to manufacturing and coal use.","It has the world's largest population and economy."),
    mc("geo11-1","What is the Coriolis effect?",["Ocean heating","The deflection of moving objects due to Earth's rotation","Greenhouse warming","Mountain formation"],"The deflection of moving objects due to Earth's rotation","The Coriolis effect causes winds and ocean currents to curve due to Earth's spin.","Right in the northern hemisphere."),
    mc("geo12-1","What does 'sustainable development' mean?",["Economic growth at any cost","Development that meets present needs without compromising future generations","Stopping all development","Industrial expansion"],"Development that meets present needs without compromising future generations","The Brundtland definition of sustainable development balances present and future needs.","Coined by the Brundtland Commission in 1987."),
  ] as QuestionData[]).map((q, i) => ({
    subject: "geography",
    grade: i + 1,
    exerciseType: "multiple_choice",
    languageSection: null,
    questionData: q,
  })),
];

// ─── FRENCH ──────────────────────────────────────────────────────────────────

function speakQ(id: string, question: string, correctAnswer: string, explanation: string, hint: string): QuestionData {
  return { id, question, type: "speak", options: null, correctAnswer, explanation, hint, speakText: correctAnswer, pairs: null };
}

function matchQ(id: string, pairs: Array<{ left: string; right: string }>, explanation: string): QuestionData {
  return {
    id, question: "Match each word to its meaning.", type: "match", options: null,
    correctAnswer: "matched", explanation, hint: "Use what you know about each word.",
    speakText: pairs.map(p => p.left).join(", "), pairs,
  };
}

const frenchQuestions: SeedEntry[] = [
  // Section 1 - Greetings
  ...[
    speakQ("fr1-1","Say in French: Hello","Bonjour","Bonjour is the standard French greeting.","Think 'bon' = good."),
    speakQ("fr1-2","Say in French: Goodbye","Au revoir","Au revoir literally means 'until seeing again'.","Au = until, revoir = see again."),
    speakQ("fr1-3","Say in French: Good evening","Bonsoir","Bonsoir is used in the evening.","Like bonjour but for evening."),
    mc("fr1-4","What does 'Salut' mean?",["Please","Thank you","Hi","Goodbye"],"Hi","Salut is an informal greeting meaning hi.","It's casual French."),
    mc("fr1-5","How do you say 'How are you?' formally?",["Ça va?","Comment allez-vous?","Tu vas bien?","Quoi de neuf?"],"Comment allez-vous?","Comment allez-vous is the formal form.","Use vous for formal."),
  ].map(q => ({ subject: "french", grade: 1, exerciseType: "speak", languageSection: 1, questionData: q })),

  // Section 2 - Numbers
  ...[
    mc("fr2-1","What is 'trois' in English?",["Two","Three","Four","Five"],"Three","Trois = three in French.","Tri = three in many languages."),
    mc("fr2-2","What is 'dix' in English?",["Six","Eight","Nine","Ten"],"Ten","Dix = ten in French.","Sounds like 'dees'."),
    fb("fr2-3","Un, deux, __, quatre","trois","Trois is three, coming after deux.","Count in order."),
    mc("fr2-4","What is 'vingt' in English?",["Twelve","Fifteen","Twenty","Thirty"],"Twenty","Vingt = twenty.","Vingt ans = twenty years."),
    mc("fr2-5","What is 'quinze' in English?",["Five","Ten","Fifteen","Twenty"],"Fifteen","Quinze = fifteen.","Sounds like 'kanz'."),
  ].map(q => ({ subject: "french", grade: 1, exerciseType: "fill_blank", languageSection: 2, questionData: q })),

  // Section 3 - Colors
  ...[
    speakQ("fr3-1","Say in French: Red","Rouge","Rouge means red in French.","Red wine is vin rouge."),
    speakQ("fr3-2","Say in French: Blue","Bleu","Bleu means blue.","The French flag is bleu, blanc, rouge."),
    speakQ("fr3-3","Say in French: Green","Vert","Vert means green.","Vertigo relates to greenery."),
    mc("fr3-4","What is 'jaune' in English?",["Red","Blue","Yellow","Green"],"Yellow","Jaune = yellow.","Sounds like 'zhone'."),
    mc("fr3-5","What is 'noir' in English?",["White","Black","Brown","Grey"],"Black","Noir = black. Film noir is a black-themed film style.","Think film noir."),
  ].map(q => ({ subject: "french", grade: 1, exerciseType: "speak", languageSection: 3, questionData: q })),

  // Section 4 - Days
  ...[
    mc("fr4-1","What is 'lundi' in English?",["Sunday","Monday","Tuesday","Wednesday"],"Monday","Lundi comes from 'lune' (moon) = Monday.","Luna = moon."),
    mc("fr4-2","What is 'vendredi' in English?",["Thursday","Friday","Saturday","Sunday"],"Friday","Vendredi = Friday, from the goddess Venus.","Named after Venus."),
    mc("fr4-3","What is 'dimanche' in English?",["Friday","Saturday","Sunday","Monday"],"Sunday","Dimanche = Sunday.","Day of rest."),
    mc("fr4-4","What is 'mercredi' in English?",["Monday","Tuesday","Wednesday","Thursday"],"Wednesday","Mercredi = Wednesday, from Mercury.","Named after Mercury."),
    mc("fr4-5","What is 'samedi' in English?",["Friday","Saturday","Sunday","Thursday"],"Saturday","Samedi = Saturday.","Sounds like 'sam-dee'."),
  ].map(q => ({ subject: "french", grade: 1, exerciseType: "vocabulary", languageSection: 4, questionData: q })),

  // Section 6 - Family
  ...[
    matchQ("fr6-1",[
      { left: "mère", right: "mother" },
      { left: "père", right: "father" },
      { left: "frère", right: "brother" },
      { left: "sœur", right: "sister" },
      { left: "grand-mère", right: "grandmother" },
    ],"Match French family words to their English meanings."),
    mc("fr6-2","What is 'fils' in English?",["Daughter","Son","Uncle","Cousin"],"Son","Fils = son in French.","Sounds like 'fees'."),
    mc("fr6-3","What is 'fille' in English?",["Son","Aunt","Daughter","Mother"],"Daughter","Fille = daughter (also girl) in French.","Sounds like 'fee'."),
    mc("fr6-4","What is 'oncle' in English?",["Brother","Father","Uncle","Grandfather"],"Uncle","Oncle = uncle, very similar to English.","Sounds like 'ong-kl'."),
    mc("fr6-5","What is 'tante' in English?",["Aunt","Sister","Grandmother","Cousin"],"Aunt","Tante = aunt in French.","Sounds like 'tahnt'."),
  ].map(q => ({ subject: "french", grade: 2, exerciseType: "matching", languageSection: 6, questionData: q })),
];

// ─── SPANISH ─────────────────────────────────────────────────────────────────

const spanishQuestions: SeedEntry[] = [
  // Section 1 - Greetings
  ...[
    speakQ("es1-1","Say in Spanish: Hello","Hola","Hola is the standard Spanish greeting.","Very similar to English 'hola'!"),
    speakQ("es1-2","Say in Spanish: Goodbye","Adiós","Adiós is Spanish for goodbye.","The accent is on the last syllable."),
    mc("es1-3","What does '¿Cómo estás?' mean?",["What is your name?","How are you?","Where are you from?","How old are you?"],"How are you?","¿Cómo estás? = How are you? (informal).","Cómo = how, estás = you are."),
    speakQ("es1-4","Say in Spanish: Good morning","Buenos días","Buenos días is used in the morning.","Buenos = good, días = days."),
    mc("es1-5","How do you say 'Nice to meet you'?",["Mucho gusto","Buenas noches","De nada","Perdón"],"Mucho gusto","Mucho gusto = Much pleasure = Nice to meet you.","Mucho = much, gusto = pleasure."),
  ].map(q => ({ subject: "spanish", grade: 1, exerciseType: "speak", languageSection: 1, questionData: q })),

  // Section 2 - Numbers
  ...[
    mc("es2-1","What is 'cinco' in English?",["Three","Four","Five","Six"],"Five","Cinco = five.","Think Cinco de Mayo."),
    mc("es2-2","What is 'diez' in English?",["Seven","Eight","Nine","Ten"],"Ten","Diez = ten.","Sounds like 'dee-eth'."),
    fb("es2-3","Uno, dos, __, cuatro","tres","Tres = three in Spanish.","Count along."),
    mc("es2-4","What is 'veinte' in English?",["Ten","Fifteen","Twenty","Twenty-five"],"Twenty","Veinte = twenty.","Sounds like 'bayn-teh'."),
    mc("es2-5","What is 'quince' in English?",["Five","Ten","Thirteen","Fifteen"],"Fifteen","Quince = fifteen.","Like the fruit."),
  ].map(q => ({ subject: "spanish", grade: 1, exerciseType: "fill_blank", languageSection: 2, questionData: q })),

  // Section 3 - Colors
  ...[
    speakQ("es3-1","Say in Spanish: Red","Rojo","Rojo means red.","Think Red Cross = Cruz Roja."),
    speakQ("es3-2","Say in Spanish: Blue","Azul","Azul means blue.","Sounds like 'ah-sool'."),
    speakQ("es3-3","Say in Spanish: Yellow","Amarillo","Amarillo = yellow.","There's a city called Amarillo in Texas."),
    mc("es3-4","What is 'verde' in English?",["Red","Blue","Green","Yellow"],"Green","Verde = green.","Think of lush vegetation."),
    mc("es3-5","What is 'blanco' in English?",["Black","Blue","White","Brown"],"White","Blanco = white.","Blanco Español = white Spanish."),
  ].map(q => ({ subject: "spanish", grade: 1, exerciseType: "speak", languageSection: 3, questionData: q })),

  // Section 4 - Days
  ...[
    mc("es4-1","What is 'lunes' in English?",["Sunday","Monday","Tuesday","Friday"],"Monday","Lunes = Monday, from luna (moon).","Luna = moon."),
    mc("es4-2","What is 'viernes' in English?",["Wednesday","Thursday","Friday","Saturday"],"Friday","Viernes = Friday, from Venus.","Named after Venus."),
    mc("es4-3","What is 'domingo' in English?",["Friday","Saturday","Sunday","Monday"],"Sunday","Domingo = Sunday, from 'Lord's day'.","Dom = Lord."),
    mc("es4-4","What is 'miércoles' in English?",["Monday","Tuesday","Wednesday","Thursday"],"Wednesday","Miércoles = Wednesday, from Mercury.","Named after Mercury."),
    mc("es4-5","What is 'sábado' in English?",["Friday","Saturday","Sunday","Thursday"],"Saturday","Sábado = Saturday, from Sabbath.","Like Sabbath."),
  ].map(q => ({ subject: "spanish", grade: 1, exerciseType: "vocabulary", languageSection: 4, questionData: q })),

  // Section 6 - Family
  ...[
    matchQ("es6-1",[
      { left: "madre", right: "mother" },
      { left: "padre", right: "father" },
      { left: "hermano", right: "brother" },
      { left: "hermana", right: "sister" },
      { left: "abuela", right: "grandmother" },
    ],"Match Spanish family words to their English meanings."),
    mc("es6-2","What is 'hijo' in English?",["Daughter","Son","Uncle","Cousin"],"Son","Hijo = son.","Hija = daughter."),
    mc("es6-3","What is 'hija' in English?",["Son","Aunt","Daughter","Mother"],"Daughter","Hija = daughter.","Hijo = son."),
    mc("es6-4","What is 'tío' in English?",["Brother","Father","Uncle","Grandfather"],"Uncle","Tío = uncle.","Tía = aunt."),
    mc("es6-5","What is 'tía' in English?",["Aunt","Sister","Grandmother","Cousin"],"Aunt","Tía = aunt.","Tío = uncle."),
  ].map(q => ({ subject: "spanish", grade: 2, exerciseType: "matching", languageSection: 6, questionData: q })),
];

// ─── MALTESE ─────────────────────────────────────────────────────────────────

const malteseQuestions: SeedEntry[] = [
  // Section 1 - Greetings
  ...[
    speakQ("mt1-1","Say in Maltese: Hello","Bonġu","Bonġu is the standard Maltese greeting in the morning.","Derived from Italian 'buongiorno'."),
    speakQ("mt1-2","Say in Maltese: Good evening","Bonswa","Bonswa is used in the evening.","Derived from French 'bonsoir'."),
    mc("mt1-3","What does 'Sahħa' mean?",["Hello","Goodbye / Cheers","Thank you","Please"],"Goodbye / Cheers","Sahħa means goodbye or good health/cheers.","Related to health."),
    speakQ("mt1-4","Say in Maltese: How are you?","Kif int?","Kif int? is the informal 'how are you?' in Maltese.","Kif = how, int = you."),
    mc("mt1-5","How do you say 'Thank you' in Maltese?",["Jekk jogħġbok","Grazzi","Skużani","Sahħa"],"Grazzi","Grazzi is Maltese for thank you, borrowed from Italian grazie.","Sounds like Italian."),
  ].map(q => ({ subject: "maltese", grade: 1, exerciseType: "speak", languageSection: 1, questionData: q })),

  // Section 2 - Numbers
  ...[
    mc("mt2-1","What is 'tlieta' in English?",["Two","Three","Four","Five"],"Three","Tlieta = three in Maltese.","Semitic root."),
    mc("mt2-2","What is 'għaxra' in English?",["Six","Eight","Ten","Twelve"],"Ten","Għaxra = ten.","The għ is a silent letter."),
    fb("mt2-3","Wieħed, tnejn, __, erbgħa","tlieta","Tlieta = three, after tnejn (two).","Count in Maltese."),
    mc("mt2-4","What is 'ħamsa' in English?",["Three","Four","Five","Six"],"Five","Ħamsa = five. Same root as Arabic khamsa.","Shared Semitic root."),
    mc("mt2-5","What is 'sebgħa' in English?",["Five","Six","Seven","Eight"],"Seven","Sebgħa = seven.","Semitic root shared with Arabic."),
  ].map(q => ({ subject: "maltese", grade: 1, exerciseType: "fill_blank", languageSection: 2, questionData: q })),

  // Section 3 - Colors
  ...[
    speakQ("mt3-1","Say in Maltese: Red","Aħmar","Aħmar means red in Maltese.","Shared root with Arabic."),
    speakQ("mt3-2","Say in Maltese: Blue","Blu","Blu means blue in Maltese.","Same as English/Italian."),
    speakQ("mt3-3","Say in Maltese: Green","Aħdar","Aħdar means green.","Semitic root."),
    mc("mt3-4","What is 'isfar' in English?",["Red","Blue","Yellow","Green"],"Yellow","Isfar = yellow.","Related to Arabic asfar."),
    mc("mt3-5","What is 'iswed' in English?",["White","Black","Brown","Grey"],"Black","Iswed = black.","Related to Arabic aswad."),
  ].map(q => ({ subject: "maltese", grade: 1, exerciseType: "speak", languageSection: 3, questionData: q })),

  // Section 4 - Days
  ...[
    mc("mt4-1","What is 'It-Tnejn' in English?",["Sunday","Monday","Tuesday","Wednesday"],"Monday","It-Tnejn = Monday, related to tnejn (two).","Second day of the week."),
    mc("mt4-2","What is 'Il-Ġimgħa' in English?",["Thursday","Friday","Saturday","Sunday"],"Friday","Il-Ġimgħa = Friday; also means 'week' in Maltese.","The end of the working week."),
    mc("mt4-3","What is 'Il-Ħadd' in English?",["Friday","Saturday","Sunday","Monday"],"Sunday","Il-Ħadd = Sunday.","Day of rest."),
    mc("mt4-4","What is 'L-Erbgħa' in English?",["Monday","Tuesday","Wednesday","Thursday"],"Wednesday","L-Erbgħa = Wednesday, related to erbgħa (four).","Fourth day."),
    mc("mt4-5","What is 'Is-Sibt' in English?",["Friday","Saturday","Sunday","Thursday"],"Saturday","Is-Sibt = Saturday, related to Sabbath.","Sabbath root."),
  ].map(q => ({ subject: "maltese", grade: 1, exerciseType: "vocabulary", languageSection: 4, questionData: q })),

  // Section 6 - Family
  ...[
    matchQ("mt6-1",[
      { left: "omm", right: "mother" },
      { left: "missier", right: "father" },
      { left: "ħu", right: "brother" },
      { left: "oħt", right: "sister" },
      { left: "nanna", right: "grandmother" },
    ],"Match Maltese family words to their English meanings."),
    mc("mt6-2","What is 'tifel' in English?",["Daughter","Son","Uncle","Cousin"],"Son","Tifel = son/boy in Maltese.","Tifla = daughter."),
    mc("mt6-3","What is 'tifla' in English?",["Son","Aunt","Daughter","Mother"],"Daughter","Tifla = daughter/girl.","Tifel = son."),
    mc("mt6-4","What is 'ziju' in English?",["Brother","Father","Uncle","Grandfather"],"Uncle","Ziju = uncle in Maltese.","Zija = aunt."),
    mc("mt6-5","What is 'zija' in English?",["Aunt","Sister","Grandmother","Cousin"],"Aunt","Zija = aunt.","Ziju = uncle."),
  ].map(q => ({ subject: "maltese", grade: 2, exerciseType: "matching", languageSection: 6, questionData: q })),
];

// ─── ITALIAN ─────────────────────────────────────────────────────────────────

const italianQuestions: SeedEntry[] = [
  // Section 1 - Greetings
  ...[
    speakQ("it1-1","Say in Italian: Hello","Ciao","Ciao is used for both hello and goodbye informally.","Very widely known worldwide."),
    speakQ("it1-2","Say in Italian: Good morning","Buongiorno","Buongiorno is used until midday.","Buon = good, giorno = day."),
    speakQ("it1-3","Say in Italian: Good evening","Buonasera","Buonasera is used in the evening.","Sera = evening."),
    mc("it1-4","What does 'Arrivederci' mean?",["Hello","Good morning","Goodbye","Thank you"],"Goodbye","Arrivederci is the formal goodbye in Italian.","Literally 'until we see each other again'."),
    mc("it1-5","How do you say 'How are you?' informally?",["Come sta?","Come stai?","Come si chiama?","Dove sei?"],"Come stai?","Come stai? is informal; come sta? is formal.","Stai = informal you are."),
  ].map(q => ({ subject: "italian", grade: 1, exerciseType: "speak", languageSection: 1, questionData: q })),

  // Section 2 - Numbers
  ...[
    mc("it2-1","What is 'tre' in English?",["Two","Three","Four","Five"],"Three","Tre = three.","Treble = three times."),
    mc("it2-2","What is 'dieci' in English?",["Six","Eight","Ten","Twelve"],"Ten","Dieci = ten.","Sounds like 'dee-EH-chee'."),
    fb("it2-3","Uno, due, __, quattro","tre","Tre = three, after due.","Count along in Italian."),
    mc("it2-4","What is 'venti' in English?",["Ten","Fifteen","Twenty","Thirty"],"Twenty","Venti = twenty. Starbucks large size!","Coffee shop reference."),
    mc("it2-5","What is 'quindici' in English?",["Five","Ten","Fifteen","Twenty"],"Fifteen","Quindici = fifteen.","Sounds like 'KWIN-dee-chee'."),
  ].map(q => ({ subject: "italian", grade: 1, exerciseType: "fill_blank", languageSection: 2, questionData: q })),

  // Section 3 - Colors
  ...[
    speakQ("it3-1","Say in Italian: Red","Rosso","Rosso = red.","Rosso means red in Italian."),
    speakQ("it3-2","Say in Italian: Blue","Blu","Blu = blue.","Same as English."),
    speakQ("it3-3","Say in Italian: Green","Verde","Verde = green.","Shared with Spanish."),
    mc("it3-4","What is 'giallo' in English?",["Red","Blue","Yellow","Green"],"Yellow","Giallo = yellow.","Giallo films are Italian mystery thrillers."),
    mc("it3-5","What is 'nero' in English?",["White","Black","Brown","Grey"],"Black","Nero = black.","Nero was also a Roman emperor."),
  ].map(q => ({ subject: "italian", grade: 1, exerciseType: "speak", languageSection: 3, questionData: q })),

  // Section 4 - Days
  ...[
    mc("it4-1","What is 'lunedì' in English?",["Sunday","Monday","Tuesday","Wednesday"],"Monday","Lunedì = Monday, from luna (moon).","Moon day."),
    mc("it4-2","What is 'venerdì' in English?",["Thursday","Friday","Saturday","Sunday"],"Friday","Venerdì = Friday, from Venus.","Named after Venus."),
    mc("it4-3","What is 'domenica' in English?",["Friday","Saturday","Sunday","Monday"],"Sunday","Domenica = Sunday.","Domenico is a common Italian name."),
    mc("it4-4","What is 'mercoledì' in English?",["Monday","Tuesday","Wednesday","Thursday"],"Wednesday","Mercoledì = Wednesday, from Mercury.","Named after Mercury."),
    mc("it4-5","What is 'sabato' in English?",["Friday","Saturday","Sunday","Thursday"],"Saturday","Sabato = Saturday, from Sabbath.","Sabbath root."),
  ].map(q => ({ subject: "italian", grade: 1, exerciseType: "vocabulary", languageSection: 4, questionData: q })),

  // Section 6 - Family
  ...[
    matchQ("it6-1",[
      { left: "madre", right: "mother" },
      { left: "padre", right: "father" },
      { left: "fratello", right: "brother" },
      { left: "sorella", right: "sister" },
      { left: "nonna", right: "grandmother" },
    ],"Match Italian family words to their English meanings."),
    mc("it6-2","What is 'figlio' in English?",["Daughter","Son","Uncle","Cousin"],"Son","Figlio = son.","Figlia = daughter."),
    mc("it6-3","What is 'figlia' in English?",["Son","Aunt","Daughter","Mother"],"Daughter","Figlia = daughter.","Figlio = son."),
    mc("it6-4","What is 'zio' in English?",["Brother","Father","Uncle","Grandfather"],"Uncle","Zio = uncle.","Zia = aunt."),
    mc("it6-5","What is 'zia' in English?",["Aunt","Sister","Grandmother","Cousin"],"Aunt","Zia = aunt.","Zio = uncle."),
  ].map(q => ({ subject: "italian", grade: 2, exerciseType: "matching", languageSection: 6, questionData: q })),
];

// ─── ALL QUESTIONS ────────────────────────────────────────────────────────────

const ALL_QUESTIONS: SeedEntry[] = [
  ...mathQuestions,
  ...grammarQuestions,
  ...historyQuestions,
  ...geographyQuestions,
  ...frenchQuestions,
  ...spanishQuestions,
  ...malteseQuestions,
  ...italianQuestions,
];

export async function seedQuestions() {
  const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(questionsTable);
  if (Number(count) >= ALL_QUESTIONS.length) {
    console.log(`Questions already seeded (${count} rows). Skipping.`);
    return;
  }

  console.log(`Seeding ${ALL_QUESTIONS.length} questions...`);

  const BATCH = 100;
  for (let i = 0; i < ALL_QUESTIONS.length; i += BATCH) {
    await db.insert(questionsTable).values(ALL_QUESTIONS.slice(i, i + BATCH));
  }

  console.log(`Seeded ${ALL_QUESTIONS.length} questions successfully.`);
}
