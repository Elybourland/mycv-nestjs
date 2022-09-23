import { Test } from "@nestjs/testing";
import { AuthService } from "./auth.service";
import { UsersService } from "./users.service";
import { User } from "./user.entity";
import { BadRequestException, NotFoundException } from "@nestjs/common";

// npm run test:watch
// press p
// auth.service.spec

describe('AuthService', () => {
  let service: AuthService;
  let fakeUsersService: Partial<UsersService>;

  beforeEach(async () => {
    // Create a fake copy of the Users Service
    fakeUsersService = {
      find: () =>  Promise.resolve([]),
      create: (email: string, password: string) => Promise.resolve({ id: 1, email, password } as User)
    }

    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: fakeUsersService
        },
      ]
    }).compile();

    service = module.get(AuthService);
  });


  it('can create an instance of auth service', async () => {
    expect(service).toBeDefined();
  });

  it('creates a new user with a salted and hashed password', async () => {
    const user = await service.signup('asdf@asdf.com', 'asdf');

    expect(user.password).not.toEqual('asdf');
    const [salt, hash] = user.password.split('.');
    expect(salt).toBeDefined();
    expect(hash).toBeDefined();
  });

  it('throws an error if user signs up with email that is in use', async () => {
    fakeUsersService.find = () =>
      Promise.resolve([{ id: 1, email: 'a', password: '1' } as User]);
    await expect(service.signup('asdf@asdf.com', 'asdf')).rejects.toThrow(
      'email in use',
    );
  });

  it('throws if signin is called with an unused email', async () => {
    await expect(service.signin('asdf@asdf.com', 'aegfvag'),
    ).rejects.toThrowError(NotFoundException);
  });

  it('throws if an invalid password is provided', async () => {
    expect.assertions(1);

    fakeUsersService.find = () => 
      Promise.resolve([
        { email: 'asdf@asdf.com', password: 'laskdjf' } as User
      ]);

      await expect(
        service.signin('lasdkj@lasdkj.com', 'passwrod')
      ).rejects.toThrow(BadRequestException);
  });

  it('returns a user if correct password is provided', async () => {

  fakeUsersService.find = () => 
    Promise.resolve([
      { email: 'asdf@asdf.com', password: 'f997161a5020652f.56ac729b9fa9b05b09cad893361205dcd6ca0ea54f247138e05ded908ed167f1' } as User
    ]);

    const user = await service.signin('asdf@asdf.com', 'mypassword');

    expect(user).toBeDefined();
  // const user = await service.signup('asdf@asdf.com', 'mypassword');
  // console.log(user);
  });
});
