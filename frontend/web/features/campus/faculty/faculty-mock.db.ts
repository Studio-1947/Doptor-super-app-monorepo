// Faculty Mock Database
// This file contains mock data for faculty members to support UI development

export interface Faculty {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: "male" | "female" | "other";
  address: string;
  qualification: string;
  specialization: string;
  experience: number; // years
  joinDate: string;
  department: string;
  designation: string;
  subjects: string[];
  assignedClasses: {
    classId: string;
    sectionId: string;
    subject: string;
  }[];
  schedule: {
    day: string;
    periods: {
      time: string;
      classId: string;
      sectionId: string;
      subject: string;
    }[];
  }[];
  status: "active" | "on-leave" | "inactive";
  salary: number;
  bloodGroup?: string;
  emergencyContact: {
    name: string;
    relation: string;
    phone: string;
  };
}

export const MOCK_FACULTY: Faculty[] = [
  {
    id: "f1",
    employeeId: "EMP001",
    firstName: "Dr. Rajesh",
    lastName: "Kumar",
    email: "rajesh.kumar@school.edu",
    phone: "+91 98765 11001",
    dateOfBirth: "1985-03-15",
    gender: "male",
    address: "123 MG Road, Bangalore, Karnataka 560001",
    qualification: "Ph.D. in Mathematics",
    specialization: "Advanced Mathematics",
    experience: 12,
    joinDate: "2012-06-01",
    department: "Mathematics",
    designation: "Senior Professor",
    subjects: ["Mathematics", "Advanced Mathematics", "Statistics"],
    assignedClasses: [
      { classId: "1", sectionId: "s1", subject: "Mathematics" },
      { classId: "2", sectionId: "s1", subject: "Advanced Mathematics" },
    ],
    schedule: [
      {
        day: "Monday",
        periods: [
          {
            time: "09:00-10:00",
            classId: "1",
            sectionId: "s1",
            subject: "Mathematics",
          },
          {
            time: "11:00-12:00",
            classId: "2",
            sectionId: "s1",
            subject: "Advanced Mathematics",
          },
        ],
      },
    ],
    status: "active",
    salary: 85000,
    bloodGroup: "O+",
    emergencyContact: {
      name: "Priya Kumar",
      relation: "Spouse",
      phone: "+91 98765 11002",
    },
  },
  {
    id: "f2",
    employeeId: "EMP002",
    firstName: "Prof. Meera",
    lastName: "Sharma",
    email: "meera.sharma@school.edu",
    phone: "+91 98765 11003",
    dateOfBirth: "1988-07-22",
    gender: "female",
    address: "456 Brigade Road, Bangalore, Karnataka 560025",
    qualification: "M.Sc. in Physics",
    specialization: "Quantum Physics",
    experience: 8,
    joinDate: "2016-08-15",
    department: "Science",
    designation: "Associate Professor",
    subjects: ["Physics", "Chemistry"],
    assignedClasses: [
      { classId: "1", sectionId: "s2", subject: "Physics" },
      { classId: "3", sectionId: "s1", subject: "Chemistry" },
    ],
    schedule: [
      {
        day: "Tuesday",
        periods: [
          {
            time: "10:00-11:00",
            classId: "1",
            sectionId: "s2",
            subject: "Physics",
          },
          {
            time: "14:00-15:00",
            classId: "3",
            sectionId: "s1",
            subject: "Chemistry",
          },
        ],
      },
    ],
    status: "active",
    salary: 72000,
    bloodGroup: "A+",
    emergencyContact: {
      name: "Ramesh Sharma",
      relation: "Father",
      phone: "+91 98765 11004",
    },
  },
  {
    id: "f3",
    employeeId: "EMP003",
    firstName: "Mr. Arjun",
    lastName: "Patel",
    email: "arjun.patel@school.edu",
    phone: "+91 98765 11005",
    dateOfBirth: "1990-11-10",
    gender: "male",
    address: "789 Indiranagar, Bangalore, Karnataka 560038",
    qualification: "M.A. in English Literature",
    specialization: "British Literature",
    experience: 6,
    joinDate: "2018-07-01",
    department: "Languages",
    designation: "Assistant Professor",
    subjects: ["English", "Literature"],
    assignedClasses: [
      { classId: "1", sectionId: "s1", subject: "English" },
      { classId: "1", sectionId: "s2", subject: "English" },
    ],
    schedule: [
      {
        day: "Wednesday",
        periods: [
          {
            time: "09:00-10:00",
            classId: "1",
            sectionId: "s1",
            subject: "English",
          },
          {
            time: "10:00-11:00",
            classId: "1",
            sectionId: "s2",
            subject: "English",
          },
        ],
      },
    ],
    status: "active",
    salary: 65000,
    bloodGroup: "B+",
    emergencyContact: {
      name: "Kavita Patel",
      relation: "Mother",
      phone: "+91 98765 11006",
    },
  },
  {
    id: "f4",
    employeeId: "EMP004",
    firstName: "Ms. Priya",
    lastName: "Reddy",
    email: "priya.reddy@school.edu",
    phone: "+91 98765 11007",
    dateOfBirth: "1992-05-18",
    gender: "female",
    address: "321 Koramangala, Bangalore, Karnataka 560034",
    qualification: "M.Sc. in Computer Science",
    specialization: "Artificial Intelligence",
    experience: 5,
    joinDate: "2019-06-15",
    department: "Computer Science",
    designation: "Assistant Professor",
    subjects: ["Computer Science", "Programming"],
    assignedClasses: [
      { classId: "2", sectionId: "s1", subject: "Computer Science" },
      { classId: "3", sectionId: "s1", subject: "Programming" },
    ],
    schedule: [
      {
        day: "Thursday",
        periods: [
          {
            time: "11:00-12:00",
            classId: "2",
            sectionId: "s1",
            subject: "Computer Science",
          },
          {
            time: "13:00-14:00",
            classId: "3",
            sectionId: "s1",
            subject: "Programming",
          },
        ],
      },
    ],
    status: "active",
    salary: 68000,
    bloodGroup: "AB+",
    emergencyContact: {
      name: "Suresh Reddy",
      relation: "Father",
      phone: "+91 98765 11008",
    },
  },
  {
    id: "f5",
    employeeId: "EMP005",
    firstName: "Dr. Anita",
    lastName: "Desai",
    email: "anita.desai@school.edu",
    phone: "+91 98765 11009",
    dateOfBirth: "1983-09-25",
    gender: "female",
    address: "654 Whitefield, Bangalore, Karnataka 560066",
    qualification: "Ph.D. in Biology",
    specialization: "Molecular Biology",
    experience: 14,
    joinDate: "2010-08-01",
    department: "Science",
    designation: "Senior Professor",
    subjects: ["Biology", "Botany", "Zoology"],
    assignedClasses: [
      { classId: "2", sectionId: "s1", subject: "Biology" },
      { classId: "3", sectionId: "s1", subject: "Botany" },
    ],
    schedule: [
      {
        day: "Friday",
        periods: [
          {
            time: "09:00-10:00",
            classId: "2",
            sectionId: "s1",
            subject: "Biology",
          },
          {
            time: "14:00-15:00",
            classId: "3",
            sectionId: "s1",
            subject: "Botany",
          },
        ],
      },
    ],
    status: "active",
    salary: 88000,
    bloodGroup: "O-",
    emergencyContact: {
      name: "Vikram Desai",
      relation: "Spouse",
      phone: "+91 98765 11010",
    },
  },
  {
    id: "f6",
    employeeId: "EMP006",
    firstName: "Mr. Karthik",
    lastName: "Iyer",
    email: "karthik.iyer@school.edu",
    phone: "+91 98765 11011",
    dateOfBirth: "1987-12-08",
    gender: "male",
    address: "987 Jayanagar, Bangalore, Karnataka 560041",
    qualification: "M.A. in History",
    specialization: "Indian History",
    experience: 9,
    joinDate: "2015-07-20",
    department: "Social Studies",
    designation: "Associate Professor",
    subjects: ["History", "Civics"],
    assignedClasses: [
      { classId: "1", sectionId: "s1", subject: "History" },
      { classId: "2", sectionId: "s1", subject: "Civics" },
    ],
    schedule: [
      {
        day: "Monday",
        periods: [
          {
            time: "13:00-14:00",
            classId: "1",
            sectionId: "s1",
            subject: "History",
          },
          {
            time: "15:00-16:00",
            classId: "2",
            sectionId: "s1",
            subject: "Civics",
          },
        ],
      },
    ],
    status: "active",
    salary: 74000,
    bloodGroup: "A-",
    emergencyContact: {
      name: "Lakshmi Iyer",
      relation: "Mother",
      phone: "+91 98765 11012",
    },
  },
  {
    id: "f7",
    employeeId: "EMP007",
    firstName: "Ms. Sneha",
    lastName: "Nair",
    email: "sneha.nair@school.edu",
    phone: "+91 98765 11013",
    dateOfBirth: "1991-04-14",
    gender: "female",
    address: "159 HSR Layout, Bangalore, Karnataka 560102",
    qualification: "M.Sc. in Chemistry",
    specialization: "Organic Chemistry",
    experience: 7,
    joinDate: "2017-06-10",
    department: "Science",
    designation: "Assistant Professor",
    subjects: ["Chemistry", "Environmental Science"],
    assignedClasses: [
      { classId: "1", sectionId: "s1", subject: "Chemistry" },
      { classId: "2", sectionId: "s2", subject: "Environmental Science" },
    ],
    schedule: [
      {
        day: "Tuesday",
        periods: [
          {
            time: "09:00-10:00",
            classId: "1",
            sectionId: "s1",
            subject: "Chemistry",
          },
          {
            time: "11:00-12:00",
            classId: "2",
            sectionId: "s2",
            subject: "Environmental Science",
          },
        ],
      },
    ],
    status: "active",
    salary: 70000,
    bloodGroup: "B-",
    emergencyContact: {
      name: "Ravi Nair",
      relation: "Father",
      phone: "+91 98765 11014",
    },
  },
  {
    id: "f8",
    employeeId: "EMP008",
    firstName: "Mr. Vikram",
    lastName: "Singh",
    email: "vikram.singh@school.edu",
    phone: "+91 98765 11015",
    dateOfBirth: "1989-08-30",
    gender: "male",
    address: "753 Marathahalli, Bangalore, Karnataka 560037",
    qualification: "M.P.Ed. in Physical Education",
    specialization: "Sports Training",
    experience: 8,
    joinDate: "2016-08-01",
    department: "Physical Education",
    designation: "Sports Coach",
    subjects: ["Physical Education", "Sports"],
    assignedClasses: [
      { classId: "1", sectionId: "s1", subject: "Physical Education" },
      { classId: "1", sectionId: "s2", subject: "Physical Education" },
    ],
    schedule: [
      {
        day: "Wednesday",
        periods: [
          {
            time: "14:00-15:00",
            classId: "1",
            sectionId: "s1",
            subject: "Physical Education",
          },
          {
            time: "15:00-16:00",
            classId: "1",
            sectionId: "s2",
            subject: "Physical Education",
          },
        ],
      },
    ],
    status: "active",
    salary: 62000,
    bloodGroup: "O+",
    emergencyContact: {
      name: "Simran Singh",
      relation: "Spouse",
      phone: "+91 98765 11016",
    },
  },
  {
    id: "f9",
    employeeId: "EMP009",
    firstName: "Ms. Divya",
    lastName: "Menon",
    email: "divya.menon@school.edu",
    phone: "+91 98765 11017",
    dateOfBirth: "1993-02-19",
    gender: "female",
    address: "852 Electronic City, Bangalore, Karnataka 560100",
    qualification: "M.A. in Economics",
    specialization: "Microeconomics",
    experience: 4,
    joinDate: "2020-07-15",
    department: "Commerce",
    designation: "Assistant Professor",
    subjects: ["Economics", "Business Studies"],
    assignedClasses: [
      { classId: "3", sectionId: "s1", subject: "Economics" },
      { classId: "3", sectionId: "s2", subject: "Business Studies" },
    ],
    schedule: [
      {
        day: "Thursday",
        periods: [
          {
            time: "09:00-10:00",
            classId: "3",
            sectionId: "s1",
            subject: "Economics",
          },
          {
            time: "10:00-11:00",
            classId: "3",
            sectionId: "s2",
            subject: "Business Studies",
          },
        ],
      },
    ],
    status: "active",
    salary: 64000,
    bloodGroup: "A+",
    emergencyContact: {
      name: "Suresh Menon",
      relation: "Father",
      phone: "+91 98765 11018",
    },
  },
  {
    id: "f10",
    employeeId: "EMP010",
    firstName: "Mr. Rahul",
    lastName: "Verma",
    email: "rahul.verma@school.edu",
    phone: "+91 98765 11019",
    dateOfBirth: "1986-06-12",
    gender: "male",
    address: "951 Banashankari, Bangalore, Karnataka 560070",
    qualification: "M.A. in Geography",
    specialization: "Physical Geography",
    experience: 10,
    joinDate: "2014-08-20",
    department: "Social Studies",
    designation: "Associate Professor",
    subjects: ["Geography", "Environmental Studies"],
    assignedClasses: [
      { classId: "1", sectionId: "s2", subject: "Geography" },
      { classId: "2", sectionId: "s1", subject: "Environmental Studies" },
    ],
    schedule: [
      {
        day: "Friday",
        periods: [
          {
            time: "10:00-11:00",
            classId: "1",
            sectionId: "s2",
            subject: "Geography",
          },
          {
            time: "13:00-14:00",
            classId: "2",
            sectionId: "s1",
            subject: "Environmental Studies",
          },
        ],
      },
    ],
    status: "active",
    salary: 76000,
    bloodGroup: "B+",
    emergencyContact: {
      name: "Anjali Verma",
      relation: "Spouse",
      phone: "+91 98765 11020",
    },
  },
  {
    id: "f11",
    employeeId: "EMP011",
    firstName: "Dr. Sunita",
    lastName: "Rao",
    email: "sunita.rao@school.edu",
    phone: "+91 98765 11021",
    dateOfBirth: "1984-10-05",
    gender: "female",
    address: "357 Rajajinagar, Bangalore, Karnataka 560010",
    qualification: "Ph.D. in Psychology",
    specialization: "Child Psychology",
    experience: 11,
    joinDate: "2013-06-15",
    department: "Counseling",
    designation: "School Counselor",
    subjects: ["Psychology", "Life Skills"],
    assignedClasses: [],
    schedule: [],
    status: "active",
    salary: 82000,
    bloodGroup: "AB-",
    emergencyContact: {
      name: "Mohan Rao",
      relation: "Spouse",
      phone: "+91 98765 11022",
    },
  },
  {
    id: "f12",
    employeeId: "EMP012",
    firstName: "Mr. Aditya",
    lastName: "Gupta",
    email: "aditya.gupta@school.edu",
    phone: "+91 98765 11023",
    dateOfBirth: "1994-01-28",
    gender: "male",
    address: "246 BTM Layout, Bangalore, Karnataka 560076",
    qualification: "M.F.A. in Fine Arts",
    specialization: "Painting",
    experience: 3,
    joinDate: "2021-08-01",
    department: "Arts",
    designation: "Art Teacher",
    subjects: ["Art", "Craft"],
    assignedClasses: [
      { classId: "1", sectionId: "s1", subject: "Art" },
      { classId: "2", sectionId: "s1", subject: "Art" },
    ],
    schedule: [
      {
        day: "Monday",
        periods: [
          {
            time: "14:00-15:00",
            classId: "1",
            sectionId: "s1",
            subject: "Art",
          },
          {
            time: "15:00-16:00",
            classId: "2",
            sectionId: "s1",
            subject: "Art",
          },
        ],
      },
    ],
    status: "active",
    salary: 58000,
    bloodGroup: "O+",
    emergencyContact: {
      name: "Neha Gupta",
      relation: "Sister",
      phone: "+91 98765 11024",
    },
  },
  {
    id: "f13",
    employeeId: "EMP013",
    firstName: "Ms. Kavya",
    lastName: "Krishnan",
    email: "kavya.krishnan@school.edu",
    phone: "+91 98765 11025",
    dateOfBirth: "1990-07-07",
    gender: "female",
    address: "468 Yelahanka, Bangalore, Karnataka 560064",
    qualification: "M.Mus. in Music",
    specialization: "Carnatic Music",
    experience: 6,
    joinDate: "2018-07-10",
    department: "Music",
    designation: "Music Teacher",
    subjects: ["Music", "Vocal Training"],
    assignedClasses: [
      { classId: "1", sectionId: "s1", subject: "Music" },
      { classId: "1", sectionId: "s2", subject: "Music" },
    ],
    schedule: [
      {
        day: "Tuesday",
        periods: [
          {
            time: "13:00-14:00",
            classId: "1",
            sectionId: "s1",
            subject: "Music",
          },
          {
            time: "14:00-15:00",
            classId: "1",
            sectionId: "s2",
            subject: "Music",
          },
        ],
      },
    ],
    status: "on-leave",
    salary: 60000,
    bloodGroup: "A+",
    emergencyContact: {
      name: "Ramesh Krishnan",
      relation: "Father",
      phone: "+91 98765 11026",
    },
  },
  {
    id: "f14",
    employeeId: "EMP014",
    firstName: "Mr. Sameer",
    lastName: "Khan",
    email: "sameer.khan@school.edu",
    phone: "+91 98765 11027",
    dateOfBirth: "1988-11-20",
    gender: "male",
    address: "579 RT Nagar, Bangalore, Karnataka 560032",
    qualification: "M.Sc. in Mathematics",
    specialization: "Applied Mathematics",
    experience: 9,
    joinDate: "2015-06-01",
    department: "Mathematics",
    designation: "Associate Professor",
    subjects: ["Mathematics", "Algebra"],
    assignedClasses: [
      { classId: "3", sectionId: "s1", subject: "Mathematics" },
      { classId: "3", sectionId: "s2", subject: "Algebra" },
    ],
    schedule: [
      {
        day: "Wednesday",
        periods: [
          {
            time: "09:00-10:00",
            classId: "3",
            sectionId: "s1",
            subject: "Mathematics",
          },
          {
            time: "11:00-12:00",
            classId: "3",
            sectionId: "s2",
            subject: "Algebra",
          },
        ],
      },
    ],
    status: "active",
    salary: 75000,
    bloodGroup: "B+",
    emergencyContact: {
      name: "Ayesha Khan",
      relation: "Spouse",
      phone: "+91 98765 11028",
    },
  },
  {
    id: "f15",
    employeeId: "EMP015",
    firstName: "Ms. Pooja",
    lastName: "Joshi",
    email: "pooja.joshi@school.edu",
    phone: "+91 98765 11029",
    dateOfBirth: "1992-03-16",
    gender: "female",
    address: "680 Malleshwaram, Bangalore, Karnataka 560003",
    qualification: "M.A. in Hindi",
    specialization: "Hindi Literature",
    experience: 5,
    joinDate: "2019-07-15",
    department: "Languages",
    designation: "Assistant Professor",
    subjects: ["Hindi", "Sanskrit"],
    assignedClasses: [
      { classId: "1", sectionId: "s1", subject: "Hindi" },
      { classId: "2", sectionId: "s1", subject: "Sanskrit" },
    ],
    schedule: [
      {
        day: "Thursday",
        periods: [
          {
            time: "10:00-11:00",
            classId: "1",
            sectionId: "s1",
            subject: "Hindi",
          },
          {
            time: "14:00-15:00",
            classId: "2",
            sectionId: "s1",
            subject: "Sanskrit",
          },
        ],
      },
    ],
    status: "active",
    salary: 66000,
    bloodGroup: "O-",
    emergencyContact: {
      name: "Rajesh Joshi",
      relation: "Father",
      phone: "+91 98765 11030",
    },
  },
  {
    id: "f16",
    employeeId: "EMP016",
    firstName: "Mr. Naveen",
    lastName: "Pillai",
    email: "naveen.pillai@school.edu",
    phone: "+91 98765 11031",
    dateOfBirth: "1987-09-09",
    gender: "male",
    address: "791 Basavanagudi, Bangalore, Karnataka 560004",
    qualification: "M.Com. in Accountancy",
    specialization: "Financial Accounting",
    experience: 10,
    joinDate: "2014-06-20",
    department: "Commerce",
    designation: "Associate Professor",
    subjects: ["Accountancy", "Business Mathematics"],
    assignedClasses: [
      { classId: "3", sectionId: "s1", subject: "Accountancy" },
      { classId: "3", sectionId: "s2", subject: "Business Mathematics" },
    ],
    schedule: [
      {
        day: "Friday",
        periods: [
          {
            time: "11:00-12:00",
            classId: "3",
            sectionId: "s1",
            subject: "Accountancy",
          },
          {
            time: "13:00-14:00",
            classId: "3",
            sectionId: "s2",
            subject: "Business Mathematics",
          },
        ],
      },
    ],
    status: "active",
    salary: 77000,
    bloodGroup: "AB+",
    emergencyContact: {
      name: "Lakshmi Pillai",
      relation: "Mother",
      phone: "+91 98765 11032",
    },
  },
  {
    id: "f17",
    employeeId: "EMP017",
    firstName: "Dr. Ramya",
    lastName: "Bhat",
    email: "ramya.bhat@school.edu",
    phone: "+91 98765 11033",
    dateOfBirth: "1982-12-25",
    gender: "female",
    address: "802 Sadashivanagar, Bangalore, Karnataka 560080",
    qualification: "Ph.D. in Political Science",
    specialization: "International Relations",
    experience: 15,
    joinDate: "2009-08-01",
    department: "Social Studies",
    designation: "Senior Professor",
    subjects: ["Political Science", "Sociology"],
    assignedClasses: [
      { classId: "3", sectionId: "s1", subject: "Political Science" },
      { classId: "3", sectionId: "s2", subject: "Sociology" },
    ],
    schedule: [
      {
        day: "Monday",
        periods: [
          {
            time: "10:00-11:00",
            classId: "3",
            sectionId: "s1",
            subject: "Political Science",
          },
          {
            time: "11:00-12:00",
            classId: "3",
            sectionId: "s2",
            subject: "Sociology",
          },
        ],
      },
    ],
    status: "active",
    salary: 90000,
    bloodGroup: "A-",
    emergencyContact: {
      name: "Suresh Bhat",
      relation: "Spouse",
      phone: "+91 98765 11034",
    },
  },
  {
    id: "f18",
    employeeId: "EMP018",
    firstName: "Mr. Deepak",
    lastName: "Shetty",
    email: "deepak.shetty@school.edu",
    phone: "+91 98765 11035",
    dateOfBirth: "1991-05-05",
    gender: "male",
    address: "913 JP Nagar, Bangalore, Karnataka 560078",
    qualification: "B.Tech. in Information Technology",
    specialization: "Web Development",
    experience: 4,
    joinDate: "2020-08-10",
    department: "Computer Science",
    designation: "Lab Instructor",
    subjects: ["Computer Lab", "Web Design"],
    assignedClasses: [
      { classId: "2", sectionId: "s1", subject: "Computer Lab" },
      { classId: "3", sectionId: "s1", subject: "Web Design" },
    ],
    schedule: [
      {
        day: "Tuesday",
        periods: [
          {
            time: "11:00-12:00",
            classId: "2",
            sectionId: "s1",
            subject: "Computer Lab",
          },
          {
            time: "15:00-16:00",
            classId: "3",
            sectionId: "s1",
            subject: "Web Design",
          },
        ],
      },
    ],
    status: "active",
    salary: 62000,
    bloodGroup: "O+",
    emergencyContact: {
      name: "Shobha Shetty",
      relation: "Mother",
      phone: "+91 98765 11036",
    },
  },
  {
    id: "f19",
    employeeId: "EMP019",
    firstName: "Ms. Anjali",
    lastName: "Chopra",
    email: "anjali.chopra@school.edu",
    phone: "+91 98765 11037",
    dateOfBirth: "1989-08-14",
    gender: "female",
    address: "124 Hebbal, Bangalore, Karnataka 560024",
    qualification: "M.Lib.Sc. in Library Science",
    specialization: "Digital Library Management",
    experience: 7,
    joinDate: "2017-07-01",
    department: "Library",
    designation: "Librarian",
    subjects: ["Library Management"],
    assignedClasses: [],
    schedule: [],
    status: "active",
    salary: 55000,
    bloodGroup: "B-",
    emergencyContact: {
      name: "Vikram Chopra",
      relation: "Spouse",
      phone: "+91 98765 11038",
    },
  },
  {
    id: "f20",
    employeeId: "EMP020",
    firstName: "Mr. Harish",
    lastName: "Babu",
    email: "harish.babu@school.edu",
    phone: "+91 98765 11039",
    dateOfBirth: "1985-04-22",
    gender: "male",
    address: "235 Vijayanagar, Bangalore, Karnataka 560040",
    qualification: "M.Sc. in Biotechnology",
    specialization: "Genetic Engineering",
    experience: 11,
    joinDate: "2013-08-15",
    department: "Science",
    designation: "Associate Professor",
    subjects: ["Biotechnology", "Microbiology"],
    assignedClasses: [
      { classId: "3", sectionId: "s1", subject: "Biotechnology" },
      { classId: "3", sectionId: "s2", subject: "Microbiology" },
    ],
    schedule: [
      {
        day: "Wednesday",
        periods: [
          {
            time: "13:00-14:00",
            classId: "3",
            sectionId: "s1",
            subject: "Biotechnology",
          },
          {
            time: "14:00-15:00",
            classId: "3",
            sectionId: "s2",
            subject: "Microbiology",
          },
        ],
      },
    ],
    status: "active",
    salary: 79000,
    bloodGroup: "A+",
    emergencyContact: {
      name: "Suma Babu",
      relation: "Spouse",
      phone: "+91 98765 11040",
    },
  },
];

// Helper Functions
export function getFacultyById(id: string): Faculty | undefined {
  return MOCK_FACULTY.find((faculty) => faculty.id === id);
}

export function getFacultyByEmployeeId(
  employeeId: string,
): Faculty | undefined {
  return MOCK_FACULTY.find((faculty) => faculty.employeeId === employeeId);
}

export function getFacultyFullName(faculty: Faculty): string {
  return `${faculty.firstName} ${faculty.lastName}`;
}

export function getFacultyInitials(faculty: Faculty): string {
  return `${faculty.firstName[0]}${faculty.lastName[0]}`;
}

export function searchFaculty(query: string): Faculty[] {
  const lowerQuery = query.toLowerCase();
  return MOCK_FACULTY.filter(
    (faculty) =>
      getFacultyFullName(faculty).toLowerCase().includes(lowerQuery) ||
      faculty.email.toLowerCase().includes(lowerQuery) ||
      faculty.employeeId.toLowerCase().includes(lowerQuery) ||
      faculty.phone.includes(query) ||
      faculty.department.toLowerCase().includes(lowerQuery) ||
      faculty.subjects.some((subject) =>
        subject.toLowerCase().includes(lowerQuery),
      ),
  );
}

export function filterFacultyByDepartment(department: string): Faculty[] {
  return MOCK_FACULTY.filter((faculty) => faculty.department === department);
}

export function filterFacultyByStatus(status: Faculty["status"]): Faculty[] {
  return MOCK_FACULTY.filter((faculty) => faculty.status === status);
}

export function getUniqueDepartments(): string[] {
  return Array.from(
    new Set(MOCK_FACULTY.map((faculty) => faculty.department)),
  ).sort();
}

export function calculateAge(dateOfBirth: string): number {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }
  return age;
}
