#!/usr/bin/perl -w
opendir my $dir, "../../templates/info" or die "Cannot open directory: $!";
my @files = readdir $dir;
closedir $dir;
my %L;
foreach my $f (@files) {
	next if $f =~ /^\./;
	next unless $f =~ s/^(.+?)(\.min)?\.js$/$1/;
	next if -d "$dir/$f";
	$f =~ s/"/\\"/g;
	$L{$f}++;
}
@files = map {'"'.$_.'"'} sort { lc($a) cmp lc($b) } keys %L;
print join(',', @files);
