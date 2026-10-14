/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{ts,tsx,js,jsx}"],
  theme: {
  	extend: {
  		opacity: Object.fromEntries(Array.from({ length: 101 }, (_, i) => [i, `${i / 100}`])),
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		colors: {
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			pastel: {
  				lavender: 'hsl(var(--pastel-lavender))',
  				pink: 'hsl(var(--pastel-pink))',
  				mint: 'hsl(var(--pastel-mint))',
  				sky: 'hsl(var(--pastel-sky))'
  			},
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			},
  			sidebar: {
  				DEFAULT: 'hsl(var(--sidebar-background))',
  				foreground: 'hsl(var(--sidebar-foreground))',
  				primary: 'hsl(var(--sidebar-primary))',
  				'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
  				accent: 'hsl(var(--sidebar-accent))',
  				'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
  				border: 'hsl(var(--sidebar-border))',
  				ring: 'hsl(var(--sidebar-ring))'
  			}
  		},
  		fontFamily: {
  			heading: ['var(--font-heading)'],
  			body: ['var(--font-body)'],
  			display: ['var(--font-display)'],
  			mono: ['var(--font-mono)'],
  			pastel: ['Quicksand', 'var(--font-body)']
  		},
  		fontWeight: {
  			'400': '400',
  			'500': '500',
  			'600': '600',
  			'700': '700',
  			'800': '800'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: { height: '0' },
  				to: { height: 'var(--radix-accordion-content-height)' }
  			},
  			'accordion-up': {
  				from: { height: 'var(--radix-accordion-content-height)' },
  				to: { height: '0' }
  			},
  			'twinkle': {
  				'0%, 100%': { opacity: '0.35' },
  				'50%': { opacity: '1' }
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-10px)' }
  			},
  			'jelly': {
  				'0%, 100%': { transform: 'scale(1, 1)' },
  				'30%': { transform: 'scale(1.25, 0.75)' },
  				'45%': { transform: 'scale(0.8, 1.2)' },
  				'60%': { transform: 'scale(1.1, 0.9)' },
  				'75%': { transform: 'scale(0.97, 1.03)' }
  			},
  			'float-up': {
  				'0%': { transform: 'translate(-50%, 0) scale(0.6)', opacity: '0' },
  				'20%': { opacity: '1', transform: 'translate(-50%, -12px) scale(1.1)' },
  				'100%': { transform: 'translate(-50%, -56px) scale(1)', opacity: '0' }
  			},
  			'pop-in': {
  				from: { transform: 'scale(0)', opacity: '0' },
  				to: { transform: 'scale(1)', opacity: '1' }
  			},
  			'wiggle': {
  				'0%, 100%': { transform: 'rotate(0)' },
  				'25%': { transform: 'rotate(-8deg)' },
  				'50%': { transform: 'rotate(8deg)' },
  				'75%': { transform: 'rotate(-4deg)' }
  			},
  			'galaxy-zoom': {
  				'0%, 100%': { transform: 'scale(1)' },
  				'50%': { transform: 'scale(1.08)' }
  			},
  			'ripple': {
  				'to': { transform: 'scale(4)', opacity: '0' }
  			},
  			'shake-x': {
  				'0%, 100%': { transform: 'translateX(0)' },
  				'20%, 60%': { transform: 'translateX(-6px)' },
  				'40%, 80%': { transform: 'translateX(6px)' }
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'twinkle': 'twinkle 4s ease-in-out infinite',
  			'float': 'float 6s ease-in-out infinite',
  			'jelly': 'jelly 0.6s ease',
  			'float-up': 'float-up 0.9s ease-out forwards',
  			'pop-in': 'pop-in 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
  			'wiggle': 'wiggle 0.5s ease-in-out',
  			'galaxy-zoom': 'galaxy-zoom 3.5s ease-in-out infinite',
  			'ripple': 'ripple 0.6s ease-out forwards',
  			'shake-x': 'shake-x 0.4s ease-in-out'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
