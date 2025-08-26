import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { VolunteerApplicationService } from './volunteer-application.service';
import { CreateVolunteerApplicationDto } from './dto/create-volunteer-application.dto';
import { UpdateVolunteerApplicationDto } from './dto/update-volunteer-application.dto';

@Controller('volunteer-application')
export class VolunteerApplicationController {
  constructor(private readonly volunteerApplicationService: VolunteerApplicationService) {}

  @Post()
  create(@Body() createVolunteerApplicationDto: CreateVolunteerApplicationDto) {
    return this.volunteerApplicationService.create(createVolunteerApplicationDto);
  }

  @Get()
  findAll() {
    return this.volunteerApplicationService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.volunteerApplicationService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateVolunteerApplicationDto: UpdateVolunteerApplicationDto) {
    return this.volunteerApplicationService.update(+id, updateVolunteerApplicationDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.volunteerApplicationService.remove(+id);
  }
}
