import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportCategory, ReportUrgency, ReportStatus, ContactPreference } from '../../entities/report.entity';
import { User } from '../../entities/user.entity';
import { Estate } from '../../entities/estate.entity';

export interface CreateReportDto {
  estate_id: string;
  category: ReportCategory;
  subject: string;
  details: string;
  location?: string;
  urgency: ReportUrgency;
  contact_preference?: ContactPreference;
  attachments?: any;
  occurred_on?: Date;
  anonymize_report?: boolean;
  allow_sharing?: boolean;
}

export interface UpdateReportDto {
  subject?: string;
  details?: string;
  location?: string;
  urgency?: ReportUrgency;
  contact_preference?: ContactPreference;
  attachments?: any;
  occurred_on?: Date;
  anonymize_report?: boolean;
  allow_sharing?: boolean;
}

export interface UpdateReportStatusDto {
  status: ReportStatus;
  assigned_to?: string;
  sla_target?: Date;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Estate)
    private estateRepository: Repository<Estate>,
  ) {}

  async createReport(userId: string, createData: CreateReportDto) {
    const {
      estate_id,
      category,
      subject,
      details,
      location,
      urgency,
      contact_preference = ContactPreference.IN_APP_ONLY,
      attachments,
      occurred_on,
      anonymize_report = false,
      allow_sharing = true,
    } = createData;

    // Verify estate exists
    const estate = await this.estateRepository.findOne({ where: { estate_id } });
    if (!estate) {
      throw new NotFoundException('Estate not found');
    }

    const report = this.reportRepository.create({
      user_id: userId,
      estate_id,
      category,
      subject,
      details,
      location,
      urgency,
      contact_preference,
      attachments,
      occurred_on: occurred_on || new Date(),
      anonymize_report,
      allow_sharing,
      status: ReportStatus.OPEN,
    });

    return await this.reportRepository.save(report);
  }

  async getUserReports(userId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [reports, total] = await this.reportRepository.findAndCount({
      where: { user_id: userId },
      relations: ['estate'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getEstateReports(estateId: string, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [reports, total] = await this.reportRepository.findAndCount({
      where: { estate_id: estateId },
      relations: ['user', 'estate'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getReportById(reportId: string) {
    const report = await this.reportRepository.findOne({
      where: { report_id: reportId },
      relations: ['user', 'estate'],
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  async updateReport(userId: string, reportId: string, updateData: UpdateReportDto) {
    const report = await this.reportRepository.findOne({
      where: { report_id: reportId, user_id: userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found or you are not the owner');
    }

    if (report.status === ReportStatus.CLOSED) {
      throw new BadRequestException('Cannot update closed report');
    }

    Object.assign(report, updateData);
    return await this.reportRepository.save(report);
  }

  async updateReportStatus(reportId: string, statusData: UpdateReportStatusDto) {
    const { status, assigned_to, sla_target } = statusData;

    const report = await this.reportRepository.findOne({
      where: { report_id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    report.status = status;
    if (assigned_to) {
      report.assigned_to = assigned_to;
    }
    if (sla_target) {
      report.sla_target = sla_target;
    }

    return await this.reportRepository.save(report);
  }

  async deleteReport(userId: string, reportId: string) {
    const report = await this.reportRepository.findOne({
      where: { report_id: reportId, user_id: userId },
    });

    if (!report) {
      throw new NotFoundException('Report not found or you are not the owner');
    }

    await this.reportRepository.remove(report);
    return { message: 'Report deleted successfully' };
  }

  async searchReports(estateId: string, query: string, category?: ReportCategory, status?: ReportStatus) {
    const qb = this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.estate', 'estate')
      .where('report.estate_id = :estateId', { estateId })
      .andWhere(
        '(report.subject ILIKE :query OR report.details ILIKE :query OR report.location ILIKE :query)',
        { query: `%${query}%` }
      );

    if (category) {
      qb.andWhere('report.category = :category', { category });
    }

    if (status) {
      qb.andWhere('report.status = :status', { status });
    }

    return await qb.orderBy('report.created_at', 'DESC').limit(20).getMany();
  }

  async getReportsByStatus(estateId: string, status: ReportStatus, page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;

    const [reports, total] = await this.reportRepository.findAndCount({
      where: { estate_id: estateId, status },
      relations: ['user', 'estate'],
      order: { created_at: 'DESC' },
      skip: offset,
      take: limit,
    });

    return {
      data: reports,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getOverdueReports(estateId: string) {
    const now = new Date();
    
    return await this.reportRepository
      .createQueryBuilder('report')
      .leftJoinAndSelect('report.user', 'user')
      .leftJoinAndSelect('report.estate', 'estate')
      .where('report.estate_id = :estateId', { estateId })
      .andWhere('report.sla_target < :now', { now })
      .andWhere('report.status NOT IN (:...closedStatuses)', { 
        closedStatuses: [ReportStatus.RESOLVED, ReportStatus.CLOSED] 
      })
      .orderBy('report.sla_target', 'ASC')
      .getMany();
  }
}
