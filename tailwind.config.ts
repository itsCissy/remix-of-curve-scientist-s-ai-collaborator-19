import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        curve: {
          sidebar: "hsl(var(--sidebar-bg))",
          "sidebar-border": "hsl(var(--sidebar-border))",
          "message-user": "hsl(var(--message-user-bg))",
          "message-agent": "hsl(var(--message-agent-bg))",
          input: "hsl(var(--input-bg))",
          hover: "hsl(var(--hover-bg))",
        },
        // XtalPi Brand Colors - Direct access
        xtalpi: {
          blue: "#123aff",
          "blue-dark": "#1609a0",
          cyan: "#00ffff",
          green: "#00ff9a",
          "green-dark": "#00a29c",
          teal: "#00ffd4",
        },
        // Agent success state
        agent: {
          success: "hsl(var(--agent-success))",
          "success-foreground": "hsl(var(--agent-success-foreground))",
        },
        // Gradient colors
        gradient: {
          "blue-start": "hsl(var(--gradient-blue-start))",
          "blue-end": "hsl(var(--gradient-blue-end))",
          "green-start": "hsl(var(--gradient-green-start))",
          "green-end": "hsl(var(--gradient-green-end))",
        },
        // Chart colors
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
        'input': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'glow-blue': '0 0 20px rgba(18, 58, 255, 0.3)',
        'glow-green': '0 0 20px rgba(0, 255, 154, 0.3)',
      },
      backgroundImage: {
        'gradient-xtalpi-blue': 'linear-gradient(90deg, #1609a0, #00ffff)',
        'gradient-xtalpi-green': 'linear-gradient(90deg, #00a29c, #00ffd4)',
        'gradient-xtalpi-blue-vertical': 'linear-gradient(180deg, #1609a0, #00ffff)',
        'gradient-xtalpi-green-vertical': 'linear-gradient(180deg, #00a29c, #00ffd4)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px rgba(18, 58, 255, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(18, 58, 255, 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;