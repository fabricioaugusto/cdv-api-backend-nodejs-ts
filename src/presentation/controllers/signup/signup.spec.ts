import { SignupController } from './signup'
import { EmailValidator } from './signup-protocols'
import { InvalidParamError, MissingParamError, ServerError } from '../../errors'
import { AddAccount, AddAccountModel } from '../../../domain/usecases/add-account'
import { AccountModel } from '../../../domain/models/account'

const makeEmailValidator = (): EmailValidator => {
  class EmailValidatorStub implements EmailValidator {
    isValid (email: string): boolean {
      return true
    }
  }
  return new EmailValidatorStub()
}

const makeAddAccount = (): AddAccount => {
  class AddAccountStub implements AddAccount {
    async add (account: AddAccountModel): Promise<AccountModel> {
      return new Promise(resolve => {
        resolve({
          id: 'any_id',
          name: 'any_name',
          email: 'any_email@email.com'
        })
      })
    }
  }
  return new AddAccountStub()
}

interface SutTypes {
  emailValidatorStub: EmailValidator
  addAccountStub: AddAccount
  sut: SignupController
}

const makeSut = (): SutTypes => {
  const emailValidatorStub: EmailValidator = makeEmailValidator()
  const addAccountStub: AddAccount = makeAddAccount()
  const sut = new SignupController(emailValidatorStub, addAccountStub)
  return {
    addAccountStub,
    emailValidatorStub,
    sut
  }
}

describe('Signup Controller', () => {
  // Test: No Name provided
  test('Should return 400 if no name is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        email: 'any_email@email.com',
        password: 'any_password',
        group: 'any_id',
        country: {},
        role: 10,
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('name'))
  })
  // Test: No E-mail provided
  test('Should return 400 if no email is provided',async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        password: 'any_password',
        group: 'any_id',
        country: {},
        role: 10,
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('email'))
  })
  // Test: Invalid E-mail
  test('Should return 400 if email is invalid',async () => {
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockReturnValueOnce(false)
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'invalid_email@email.com',
        password: 'any_password',
        group: 'any_id',
        country: {},
        role: 10,
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new InvalidParamError('email'))
  })
  // Test: EmailValidator with correct email
  test('Should call EmailValidator with correct email',async () => {
    const { sut, emailValidatorStub } = makeSut()
    const isValidSpyOn = jest.spyOn(emailValidatorStub, 'isValid')
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        group: 'any_id',
        country: {},
        role: 10,
        status: 1
      }
    }
    await sut.handle(httpRequest)
    expect(isValidSpyOn).toHaveBeenCalledWith('any_email@email.com')
  })
  // Test: Email Validator Server Error
  test('Should return 500 if EmailValidator throws', async () => {
    const { sut, emailValidatorStub } = makeSut()
    jest.spyOn(emailValidatorStub, 'isValid').mockImplementationOnce(() => {
      throw new Error()
    })
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        group: 'any_id',
        country: {},
        role: 10,
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })
  // Test: No Group provided
  test('Should return 400 if no group is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        country: {},
        role: 10,
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('group'))
  })
  // Test: No Country provided
  test('Should return 400 if no country is provided', async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        group: 'any_id',
        role: 10,
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('country'))
  })
  // Test: No Role provided
  test('Should return 400 if no role is provided',async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        group: 'any_id',
        country: {},
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('role'))
  })
  // Test: No Status provided
  test('Should return 400 if no status is provided',async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        group: 'any_id',
        country: {},
        role: 10
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(400)
    expect(httpResponse.body).toEqual(new MissingParamError('status'))
  })
  // Test: Call AddAccount
  test('Should call AddAccount with correct data',async () => {
    const { sut, addAccountStub } = makeSut()
    const addSpy = jest.spyOn(addAccountStub, 'add')
    const body = {
      name: 'any_name',
      email: 'any_email@email.com',
      password: 'any_password',
      group: 'any_id',
      country: {},
      role: 10,
      status: 1
    }
    const httpRequest = { body }
    await sut.handle(httpRequest)
    expect(addSpy).toHaveBeenCalledWith(body)
  })
  // Test: Add Account Server Error
  test('Should return 500 if AddAccount throws',async () => {
    const { sut, addAccountStub } = makeSut()
    jest.spyOn(addAccountStub, 'add').mockImplementationOnce(async () => {
      return new Promise((resolve, reject) => {
        reject(new Error())
      })
    })
    const httpRequest = {
      body: {
        name: 'any_name',
        email: 'any_email@email.com',
        password: 'any_password',
        group: 'any_id',
        country: {},
        role: 10,
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(500)
    expect(httpResponse.body).toEqual(new ServerError())
  })
  // Test: Valid data is provided
  test('Should return 200 if valid data is provided',async () => {
    const { sut } = makeSut()
    const httpRequest = {
      body: {
        name: 'valid_name',
        email: 'valid_email@email.com',
        password: 'valid_password',
        group: 'valid_id',
        country: {},
        role: 10,
        status: 1
      }
    }
    const httpResponse = await sut.handle(httpRequest)
    expect(httpResponse.statusCode).toBe(200)
    expect(httpResponse.body).toEqual({
      id: 'any_id',
      name: 'any_name',
      email: 'any_email@email.com'
    })
  })
})
