import { validateSignUpForm } from '~/lib/validation'

describe('validateSignUpForm', () => {
  it('returns errors when all fields are empty', () => {
    const result = validateSignUpForm({ name: '', email: '', password: '' })
    expect(result.name).toBeTruthy()
    expect(result.email).toBeTruthy()
    expect(result.password).toBeTruthy()
  })

  it('returns error when name is too short', () => {
    const result = validateSignUpForm({ name: 'A', email: 'test@example.com', password: 'password123' })
    expect(result.name).toBeTruthy()
    expect(result.email).toBe('')
    expect(result.password).toBe('')
  })

  it('returns error for invalid email', () => {
    const result = validateSignUpForm({ name: 'Alex', email: 'notanemail', password: 'password123' })
    expect(result.email).toBeTruthy()
    expect(result.name).toBe('')
    expect(result.password).toBe('')
  })

  it('returns error when password is too short', () => {
    const result = validateSignUpForm({ name: 'Alex', email: 'test@example.com', password: 'short' })
    expect(result.password).toBeTruthy()
    expect(result.name).toBe('')
    expect(result.email).toBe('')
  })

  it('returns no errors for valid input', () => {
    const result = validateSignUpForm({ name: 'Alex', email: 'test@example.com', password: 'password123' })
    expect(result.name).toBe('')
    expect(result.email).toBe('')
    expect(result.password).toBe('')
  })
})
