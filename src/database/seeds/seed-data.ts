import { DataSource } from 'typeorm';
import { PaymentProvider } from '../../entities/payment-provider.entity';
import { User, UserStatus } from '../../entities/user.entity';
import { UserProfile, UserRole, ApartmentType } from '../../entities/user-profile.entity';
import { Estate } from '../../entities/estate.entity';
import { Wallet } from '../../entities/wallet.entity';
import { Service } from '../../entities/service.entity';
import { UtilityProvider, UtilityCategory } from '../../entities/utility-provider.entity';
import { Alert, AlertType, UrgencyLevel } from '../../entities/alert.entity';
import { BankServiceCharge, PaymentFrequency } from '../../entities/bank-service-charge.entity';
import { LostFoundItem, ItemType } from '../../entities/lost-found-item.entity';
import { Provider } from '../../entities/provider.entity';
import { ProviderPhoto } from '../../entities/provider-photo.entity';
import { ProviderReview } from '../../entities/provider-review.entity';
import { UtilityAccount } from '../../entities/utility-account.entity';
import { UtilityBill, BillStatus } from '../../entities/utility-bill.entity';
import { AccessCode } from '../../entities/access-code.entity';
import { DeviceToken, Platform } from '../../entities/device-token.entity';
import { Report, ReportCategory, ReportUrgency, ReportStatus, ContactPreference } from '../../entities/report.entity';
import { Plan, PlanType, BillingCycle } from '../../entities/plan.entity';
import * as bcrypt from 'bcryptjs';

export class SeedData {
  public static async run(dataSource: DataSource): Promise<void> {
    const queryRunner = dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Seed Payment Providers
      const paymentProviders = [
        { name: 'PAYSTACK', metadata: { api_url: 'https://api.paystack.co' } },
        { name: 'CARD', metadata: { processor: 'stripe' } },
        { name: 'TRANSFER', metadata: { banks: ['GTBank', 'Access Bank', 'Zenith Bank'] } },
        { name: 'WALLET', metadata: { internal: true } },
      ];
 
      for (const providerData of paymentProviders) {
        const existingProvider = await queryRunner.manager.findOne(PaymentProvider, {
          where: { name: providerData.name },
        });

        if (!existingProvider) {
          const provider = queryRunner.manager.create(PaymentProvider, providerData);
          await queryRunner.manager.save(provider);
        }
      }

      // Seed Plans
      const plans = [
        {
          code: 'NORMAL_MONTHLY',
          name: 'Normal Monthly Plan',
          type: PlanType.NORMAL,
          price_ngn: 5000,
          billing_cycle: BillingCycle.MONTHLY,
          max_members: 1,
          is_active: true,
        },
        {
          code: 'NORMAL_YEARLY',
          name: 'Normal Yearly Plan',
          type: PlanType.NORMAL,
          price_ngn: 50000,
          billing_cycle: BillingCycle.YEARLY,
          max_members: 1,
          is_active: true,
        },
        {
          code: 'FAMILY_MONTHLY',
          name: 'Family Monthly Plan',
          type: PlanType.FAMILY,
          price_ngn: 15000,
          billing_cycle: BillingCycle.MONTHLY,
          max_members: 5,
          is_active: true,
        },
        {
          code: 'FAMILY_YEARLY',
          name: 'Family Yearly Plan',
          type: PlanType.FAMILY,
          price_ngn: 150000,
          billing_cycle: BillingCycle.YEARLY,
          max_members: 5,
          is_active: true,
        },
      ];

      for (const planData of plans) {
        const existingPlan = await queryRunner.manager.findOne(Plan, {
          where: { code: planData.code },
        });

        if (!existingPlan) {
          const plan = queryRunner.manager.create(Plan, planData);
          await queryRunner.manager.save(plan);
        }
      }

      // Seed Services
      const services = [
        'Electrician',
        'Plumber',
        'Carpenter',
        'Painter',
        'Cleaner',
        'Security Guard',
        'Gardener',
        'AC Technician',
        'Generator Technician',
        'Internet Technician',
      ];

      for (const serviceName of services) {
        const existingService = await queryRunner.manager.findOne(Service, {
          where: { name: serviceName },
        });

        if (!existingService) {
          const service = queryRunner.manager.create(Service, { name: serviceName });
          await queryRunner.manager.save(service);
        }
      }

      // Seed Utility Providers
      const utilityProviders = [
        { name: 'PHCN', category: UtilityCategory.POWER, metadata: { region: 'national' } },
        { name: 'Water Board', category: UtilityCategory.WATER, metadata: { region: 'state' } },
        { name: 'Waste Management', category: UtilityCategory.WASTE, metadata: { region: 'local' } },
        { name: 'Gas Company', category: UtilityCategory.GAS, metadata: { region: 'national' } },
        { name: 'Internet Provider', category: UtilityCategory.INTERNET, metadata: { region: 'national' } },
      ];

      for (const providerData of utilityProviders) {
        const existingProvider = await queryRunner.manager.findOne(UtilityProvider, {
          where: { name: providerData.name },
        });

        if (!existingProvider) {
          const provider = queryRunner.manager.create(UtilityProvider, providerData);
          await queryRunner.manager.save(provider);
        }
      }

      // Seed Sample Estate
      let estate = await queryRunner.manager.findOne(Estate, {
        where: { name: 'Sample Estate' },
      });

      if (!estate) {
        const newEstate = queryRunner.manager.create(Estate, {
          name: 'Sample Estate',
          email: 'admin@sampleestate.com',
          address: '123 Sample Street, Lagos, Nigeria',
        });
        estate = await queryRunner.manager.save(newEstate);
      }

      // Seed Admin User
      let savedAdmin = await queryRunner.manager.findOne(User, {
        where: { email: 'admin@vaultify.com' },
      });

      if (!savedAdmin) {
        const hashedPassword = await bcrypt.hash('admin123', 12);
        
        const adminUser = queryRunner.manager.create(User, {
          email: 'admin@vaultify.com',
          password_hash: hashedPassword,
          first_name: 'Admin',
          last_name: 'User',
          status: UserStatus.ACTIVE,
        });
        
        savedAdmin = await queryRunner.manager.save(adminUser);

        // Create super admin profile
        const adminProfile = queryRunner.manager.create(UserProfile, {
          user_id: savedAdmin.user_id,
          phone_number: '+2348000000000',
          role: UserRole.SUPER_ADMIN,
          apartment_type: ApartmentType.PENTHOUSE,
          house_address: 'Admin Office',
        });
        await queryRunner.manager.save(adminProfile);

        // Create admin wallet
        const adminWallet = queryRunner.manager.create(Wallet, {
          user_id: savedAdmin.user_id,
          available_balance: 0,
        });
        await queryRunner.manager.save(adminWallet);
      }

      // Create sample residents only if estate and savedAdmin exist
      if (estate && savedAdmin) {
        const residents = [
          {
            email: 'john.doe@sampleestate.com',
            first_name: 'John',
            last_name: 'Doe',
            phone: '+2348012345678',
            role: UserRole.RESIDENCE,
            apartment_type: ApartmentType.TWO_BEDROOM,
            house_address: 'Block A, Flat 101',
          },
          {
            email: 'jane.smith@sampleestate.com',
            first_name: 'Jane',
            last_name: 'Smith',
            phone: '+2348012345679',
            role: UserRole.RESIDENCE,
            apartment_type: ApartmentType.THREE_BEDROOM,
            house_address: 'Block B, Flat 205',
          },
          {
            email: 'security@sampleestate.com',
            first_name: 'Mike',
            last_name: 'Security',
            phone: '+2348012345680',
            role: UserRole.SECURITY_PERSONNEL,
            apartment_type: ApartmentType.ONE_BEDROOM,
            house_address: 'Security Quarters',
          },
        ];

        for (const residentData of residents) {
          const hashedPassword = await bcrypt.hash('password123', 12);
          
          const resident = queryRunner.manager.create(User, {
            email: residentData.email,
            password_hash: hashedPassword,
            first_name: residentData.first_name,
            last_name: residentData.last_name,
            status: UserStatus.ACTIVE,
          });
          
          const savedResident = await queryRunner.manager.save(resident);

          // Create resident profile
          const residentProfile = queryRunner.manager.create(UserProfile, {
            user_id: savedResident.user_id,
            phone_number: residentData.phone,
            role: residentData.role,
            apartment_type: residentData.apartment_type,
            house_address: residentData.house_address,
            estate_id: estate.estate_id,
          });
          await queryRunner.manager.save(residentProfile);

          // Create resident wallet
          const residentWallet = queryRunner.manager.create(Wallet, {
            user_id: savedResident.user_id,
            available_balance: 10000, // Give residents some initial balance
          });
          await queryRunner.manager.save(residentWallet);
        }
      }

      // Seed Sample Providers
      const electricianService = await queryRunner.manager.findOne(Service, {
        where: { name: 'Electrician' },
      });

      if (electricianService && savedAdmin) {
        const existingProvider = await queryRunner.manager.findOne(Provider, {
          where: { first_name: 'Sample', last_name: 'Electrician' },
        });

        if (!existingProvider) {
          const provider = queryRunner.manager.create(Provider, {
            service_id: electricianService.service_id,
            admin_user_id: savedAdmin.user_id,
            first_name: 'Sample',
            last_name: 'Electrician',
            phone: '+2348012345681',
            location: 'Lagos, Nigeria',
            availability: 'Monday-Friday, 8AM-6PM',
            bio: 'Professional electrician with 10+ years experience',
            skill: 'Electrical repairs, installations, maintenance',
            profile_picture_url: 'https://example.com/electrician.jpg',
          });
          const savedProvider = await queryRunner.manager.save(provider);

          // Add provider photo
          const providerPhoto = queryRunner.manager.create(ProviderPhoto, {
            provider_id: savedProvider.provider_id,
            image_url: 'https://example.com/electrician-work.jpg',
          });
          await queryRunner.manager.save(providerPhoto);

          // Add provider review
          const providerReview = queryRunner.manager.create(ProviderReview, {
            provider_id: savedProvider.provider_id,
            reviewer_name: 'John Doe',
            rating: 5,
            comment: 'Excellent work! Very professional and punctual.',
          });
          await queryRunner.manager.save(providerReview);
        }
      }

      // Seed Sample Utility Accounts
      const phcnProvider = await queryRunner.manager.findOne(UtilityProvider, {
        where: { name: 'PHCN' },
      });

      if (phcnProvider) {
        const users = await queryRunner.manager.find(User, {
          where: { status: UserStatus.ACTIVE },
          take: 3,
        });

        for (const user of users) {
          const existingAccount = await queryRunner.manager.findOne(UtilityAccount, {
            where: { user_id: user.user_id, utility_provider_id: phcnProvider.utility_provider_id },
          });

          if (!existingAccount) {
            const utilityAccount = queryRunner.manager.create(UtilityAccount, {
              user_id: user.user_id,
              utility_provider_id: phcnProvider.utility_provider_id,
              account_number: `PHCN${Math.random().toString(36).substr(2, 8).toUpperCase()}`,
              address: 'Sample Estate, Lagos',
              is_default: true,
            });
            await queryRunner.manager.save(utilityAccount);

            // Create sample utility bill
            const utilityBill = queryRunner.manager.create(UtilityBill, {
              utility_account_id: utilityAccount.utility_account_id,
              billing_period_start: new Date('2024-01-01'),
              billing_period_end: new Date('2024-01-31'),
              amount_due: 15000,
              due_date: new Date('2024-02-15'),
              status: BillStatus.UNPAID,
              generated_at: new Date(),
            });
            await queryRunner.manager.save(utilityBill);
          }
        }
      }

      // Seed Sample Bank Service Charges
      const bankServiceChargeUsers = await queryRunner.manager.find(User, {
        where: { status: UserStatus.ACTIVE },
        take: 2,
      });

      for (const user of bankServiceChargeUsers) {
        const existingBSC = await queryRunner.manager.findOne(BankServiceCharge, {
          where: { user_id: user.user_id },
        });

        if (!existingBSC) {
          const bankServiceCharge = queryRunner.manager.create(BankServiceCharge, {
            user_id: user.user_id,
            service_charge: 5000,
            paid_charge: 2000,
            outstanding_charge: 3000,
            payment_frequency: PaymentFrequency.MONTHLY,
            bank_name: 'GTBank',
            account_name: `${user.first_name} ${user.last_name}`,
            account_number: `${Math.random().toString().substr(2, 10)}`,
          });
          await queryRunner.manager.save(bankServiceCharge);
        }
      }

      // Seed Sample Alerts
      const adminUser = await queryRunner.manager.findOne(User, {
        where: { email: 'admin@vaultify.com' },
      });

      if (adminUser) {
        const existingAlert = await queryRunner.manager.findOne(Alert, {
          where: { message: 'Welcome to Sample Estate!' },
        });

        if (!existingAlert) {
          const alert = queryRunner.manager.create(Alert, {
            sender_user_id: adminUser.user_id,
            message: 'Welcome to Sample Estate! Please ensure you have completed your profile setup.',
            alert_type: AlertType.GENERAL,
            urgency_level: UrgencyLevel.MEDIUM,
            recipients: { type: 'all_residents', estate_id: estate.estate_id },
            timestamp: new Date(),
          });
          await queryRunner.manager.save(alert);
        }
      }

      // Seed Sample Lost & Found Items
      const lostFoundUsers = await queryRunner.manager.find(User, {
        where: { status: UserStatus.ACTIVE },
        take: 2,
      });

      if (estate) {
        for (const user of lostFoundUsers) {
          const existingItem = await queryRunner.manager.findOne(LostFoundItem, {
            where: { sender_user_id: user.user_id },
          });

          if (!existingItem) {
            const lostFoundItem = queryRunner.manager.create(LostFoundItem, {
              sender_user_id: user.user_id,
              estate_id: estate.estate_id,
              description: 'Found a black wallet near the main gate',
              item_type: ItemType.FOUND,
              location: 'Main Gate Area',
              contact_info: user.profile?.phone_number || '+2348000000000',
              image_url: 'https://example.com/wallet.jpg',
              date_reported: new Date(),
            });
            await queryRunner.manager.save(lostFoundItem);
          }
        }
      }

      // Seed Sample Access Codes
      const accessCodeUsers = await queryRunner.manager.find(User, {
        where: { status: UserStatus.ACTIVE },
        take: 2,
      });

      for (const user of accessCodeUsers) {
        const existingCode = await queryRunner.manager.findOne(AccessCode, {
          where: { creator_user_id: user.user_id },
        });

        if (!existingCode) {
          const accessCode = queryRunner.manager.create(AccessCode, {
            code: `VISIT${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
            creator_user_id: user.user_id,
            visitor_name: 'Sample Visitor',
            visitor_email: 'visitor@example.com',
            visitor_phone: '+2348012345682',
            valid_from: new Date(),
            valid_to: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
            max_uses: 5,
            current_uses: 0,
            gate: 'Main Gate',
            is_active: true,
            notify_on_use: true,
          });
          await queryRunner.manager.save(accessCode);
        }
      }

      // Seed Sample Device Tokens
      const deviceTokenUsers = await queryRunner.manager.find(User, {
        where: { status: UserStatus.ACTIVE },
        take: 2,
      });

      for (const user of deviceTokenUsers) {
        const existingToken = await queryRunner.manager.findOne(DeviceToken, {
          where: { user_id: user.user_id },
        });

        if (!existingToken) {
          const deviceToken = queryRunner.manager.create(DeviceToken, {
            user_id: user.user_id,
            token: `sample_token_${user.user_id}_${Date.now()}`,
            platform: Platform.ANDROID,
            device_id: `device_${user.user_id}`,
            last_seen: new Date(),
          });
          await queryRunner.manager.save(deviceToken);
        }
      }

      // Seed Sample Reports
      const reportUsers = await queryRunner.manager.find(User, {
        where: { status: UserStatus.ACTIVE },
        take: 2,
      });

      if (estate) {
        for (const user of reportUsers) {
          const existingReport = await queryRunner.manager.findOne(Report, {
            where: { user_id: user.user_id },
          });

          if (!existingReport) {
            const report = queryRunner.manager.create(Report, {
              user_id: user.user_id,
              estate_id: estate.estate_id,
              category: ReportCategory.MAINTENANCE,
              subject: 'Broken streetlight',
              details: 'The streetlight near Block A is not working properly',
              location: 'Block A, Street 1',
              urgency: ReportUrgency.MEDIUM,
              contact_preference: ContactPreference.IN_APP_ONLY,
              occurred_on: new Date(),
              anonymize_report: false,
              allow_sharing: true,
              status: ReportStatus.OPEN,
            });
            await queryRunner.manager.save(report);
          }
        }
      }

      await queryRunner.commitTransaction();
      console.log('✅ Database seeded successfully with all ERD entities');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error seeding database:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
