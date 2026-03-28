interface SignUpFormData {
  name: string
  email: string
  password: string
}

interface SignUpFormErrors {
  name: string
  email: string
  password: string
}

export function validateSignUpForm(data: SignUpFormData): SignUpFormErrors {
  return {
    name: data.name.trim().length < 2 ? 'Name must be at least 2 characters' : '',
    email: !data.email.includes('@') ? 'Enter a valid email address' : '',
    password: data.password.length < 8 ? 'Password must be at least 8 characters' : '',
  }
}
